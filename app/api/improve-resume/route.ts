import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/usage";
import { cachedAiGenerateJsonWithGuard } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { logActivity } from "@/lib/activityFeed";
import { recordDailyActivity } from "@/lib/streakSystem";
import { validateTextLength } from "@/lib/validation";
import type { ImprovedResumeContent } from "@/types/analysis";
import { normalizeImprovedResumeContent } from "@/lib/normalizeImprovedResume";
import { buildStructuredPrompt } from "@/lib/aiPromptFactory";
import { AI_INPUT_BUDGETS, sanitizeResumeForAi, sanitizeTextForAi } from "@/lib/aiInputSanitizer";
import type { StructuredResume } from "@/types/structuredResume";
import { CREDITS_EXHAUSTED_CODE, isCreditsExhaustedError } from "@/lib/aiCreditError";

const BASE_PROMPT = buildStructuredPrompt({
  role: "ATS resume rewriter",
  task: `Rewrite the provided resume to improve ATS outcomes and clarity.
Keep facts truthful; improve wording, structure, and impact statements.`,
  schema: `{
  "summary": "",
  "skills": [],
  "experience": [{"title":"","company":"","bullets":[]}],
  "projects": [{"name":"","description":"","bullets":[]}],
  "education": ""
}`,
  constraints: [
    "Always include keys: summary, skills, experience, projects, education",
    "Use [] or \"\" when data is missing",
    "skills max 25 strings",
    "Experience and project bullets must be string arrays",
    "No markdown and no extra keys",
  ],
});

const JOB_TAILOR_TARGET_ROLE_PROMPT = `

IMPORTANT — Tailor for THIS target job (career pivot or new role allowed): The candidate wants the resume aligned with the job below. Prioritize keywords and requirements from the job description. Refocus experience and skills toward this role when truthful. Keep the same JSON structure.`;

const JOB_TAILOR_OPTIMIZE_CURRENT_PROMPT = `

IMPORTANT — Same career path (polish, not pivot): The candidate wants the resume improved for their CURRENT field and trajectory. If a job description is provided, use it only as light keyword hints — do NOT rewrite the entire resume as a career pivot unless the job clearly matches their existing path. Keep the same JSON structure.`;

const ANALYSIS_FEEDBACK_PROMPT = `

CRITICAL - This resume was just ATS-analyzed and scored {{ATS_SCORE}}%. The analyzer reported:
- Missing skills to add/emphasize: {{MISSING_SKILLS}}
- Improvements needed: {{RESUME_IMPROVEMENTS}}

Rewrite the resume so it explicitly addresses EVERY point above (add or naturally weave in the missing skills where truthful; implement each suggested improvement). The goal is that re-analyzing this improved resume on the same ATS criteria would score 90-100%. Keep the same JSON structure.`;

const SYSTEM_PROMPT = BASE_PROMPT;

type CompactResumeProfile = {
  summary: string;
  skills: string[];
  experience_highlights: string[];
  project_highlights: string[];
  education: string;
  preferred_roles: string[];
};

const COMPACT_EXTRACT_PROMPT = buildStructuredPrompt({
  role: "resume compressor",
  task: "Extract compact, factual profile data from resume text for downstream rewriting.",
  schema: `{
  "summary":"",
  "skills":[],
  "experience_highlights":[],
  "project_highlights":[],
  "education":"",
  "preferred_roles":[]
}`,
  constraints: [
    "Keep facts only; do not invent",
    "skills max 20 strings",
    "experience_highlights max 8 strings",
    "project_highlights max 6 strings",
    "preferred_roles max 5 strings",
  ],
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", requestId, retryable: false }, { status: 401 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly.", requestId, retryable: true, nextAction: "Retry shortly" },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", requestId, retryable: false }, { status: 400 });
  }
  const resumeText = body?.resumeText ?? body?.resume_text;
  const resumeId = body?.resumeId;
  const jobTitle = typeof body?.jobTitle === "string" ? body.jobTitle.trim() : undefined;
  const jobDescription = typeof body?.jobDescription === "string" ? body.jobDescription.trim() : undefined;
  /** target_job = align resume to JD (incl. career change); optimize_current = polish same path, JD as hints only */
  const tailorIntent =
    body?.tailorIntent === "optimize_current" ? "optimize_current" : "target_job";
  const previousAnalysis = body?.previousAnalysis as
    | { atsScore?: number; missingSkills?: string[]; resumeImprovements?: string[] }
    | undefined;

  // Validate input size
  const textVal = validateTextLength(resumeText as string | undefined, 50000, "resumeText");
  if (!textVal.valid) {
    return NextResponse.json({ error: textVal.error, requestId, retryable: false }, { status: 400 });
  }

  // Atomic usage check + log
  const planType = user.profile?.plan_type ?? "free";
  const { allowed } = await checkAndLogUsage(user.id, "resume_improve", planType);
  if (!allowed) {
    return NextResponse.json(
      { error: "AI Resume Fixer is a Pro feature. Upgrade to use it." },
      { status: 403 }
    );
  }

  const safeResumeText = textVal.text;
  const resumeForAi = sanitizeResumeForAi(safeResumeText, AI_INPUT_BUDGETS.resumeImproveChars);
  let compactProfile: CompactResumeProfile = {
    summary: "",
    skills: [],
    experience_highlights: [],
    project_highlights: [],
    education: "",
    preferred_roles: [],
  };
  try {
    compactProfile = await cachedAiGenerateJsonWithGuard<CompactResumeProfile>({
      systemPrompt: COMPACT_EXTRACT_PROMPT,
      userContent: resumeForAi,
      cacheFeature: "resume_compact_profile",
      featureName: "resume_improve",
      userId: user.id,
      rolloutKey: user.id,
      telemetryTag: "resume_compact_profile",
      normalize: (input) => {
        const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
        return {
          summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
          skills: Array.isArray(raw.skills) ? raw.skills.map(String).slice(0, 20) : [],
          experience_highlights: Array.isArray(raw.experience_highlights)
            ? raw.experience_highlights.map(String).slice(0, 8)
            : [],
          project_highlights: Array.isArray(raw.project_highlights)
            ? raw.project_highlights.map(String).slice(0, 6)
            : [],
          education: typeof raw.education === "string" ? raw.education.trim() : "",
          preferred_roles: Array.isArray(raw.preferred_roles) ? raw.preferred_roles.map(String).slice(0, 5) : [],
        };
      },
      retries: 1,
    });
  } catch {
    // Keep fallback defaults; final pass still works with sanitized resume.
  }

  let prompt = SYSTEM_PROMPT;
  const compactPayload: Partial<StructuredResume> & {
    experience_highlights: string[];
    project_highlights: string[];
  } = {
    summary: compactProfile.summary,
    skills: compactProfile.skills,
    preferred_roles: compactProfile.preferred_roles,
    experience_highlights: compactProfile.experience_highlights,
    project_highlights: compactProfile.project_highlights,
    education: compactProfile.education ? [{ degree: compactProfile.education, institution: "", year: "" }] : [],
  };
  let userContent = `Compact profile JSON:\n${JSON.stringify(compactPayload)}\n\nRaw resume fallback:\n${resumeForAi}`;

  if (previousAnalysis && (previousAnalysis.missingSkills?.length || previousAnalysis.resumeImprovements?.length)) {
    const atsScore = previousAnalysis.atsScore ?? 0;
    const missingStr = (previousAnalysis.missingSkills ?? []).length
      ? (previousAnalysis.missingSkills ?? []).join(", ")
      : "none listed";
    const improvementsStr = (previousAnalysis.resumeImprovements ?? []).length
      ? (previousAnalysis.resumeImprovements ?? []).join("; ")
      : "none listed";
    const analysisBlock = ANALYSIS_FEEDBACK_PROMPT.replace("{{ATS_SCORE}}", String(atsScore))
      .replace("{{MISSING_SKILLS}}", missingStr)
      .replace("{{RESUME_IMPROVEMENTS}}", improvementsStr);
    prompt = `${BASE_PROMPT}\n\nTASK ADDENDUM:\n${analysisBlock}`;
    userContent = `Compact profile JSON:\n${JSON.stringify(compactPayload)}\n\nPrior ATS feedback mode.\n\nRaw resume fallback:\n${resumeForAi}`;
  } else if (jobTitle || jobDescription) {
    const tailorBlock =
      tailorIntent === "optimize_current"
        ? JOB_TAILOR_OPTIMIZE_CURRENT_PROMPT
        : JOB_TAILOR_TARGET_ROLE_PROMPT;
    prompt = `${BASE_PROMPT}\n\nTASK ADDENDUM:\n${tailorBlock}`;
    const jobDescriptionForAi = sanitizeTextForAi(
      jobDescription || "",
      Math.min(4000, AI_INPUT_BUDGETS.jobMatchJobDescriptionChars)
    );
    userContent = `Target role: ${jobTitle || "N/A"}\n\nJob description:\n${jobDescriptionForAi}\n\nCompact profile JSON:\n${JSON.stringify(compactPayload)}\n\nRaw resume fallback:\n${resumeForAi}`;
  }

  let content: ImprovedResumeContent;
  try {
    content = await cachedAiGenerateJsonWithGuard<ImprovedResumeContent>({
      systemPrompt: prompt,
      userContent,
      cacheFeature: "resume_improve",
      featureName: "resume_improve",
      userId: user.id,
      rolloutKey: user.id,
      telemetryTag: "resume_improve",
      normalize: (input) => normalizeImprovedResumeContent(input),
      retries: 1,
    });
  } catch (e) {
    if (isCreditsExhaustedError(e)) {
      return NextResponse.json(
        {
          error: CREDITS_EXHAUSTED_CODE,
          message: "You have reached your AI credit limit. Please upgrade.",
          requestId,
          retryable: false,
          nextAction: "Upgrade plan",
        },
        { status: 402 }
      );
    }
    console.error("Improve resume error:", e);
    return NextResponse.json(
      {
        error:
          "We couldn’t format your improved resume. Try again, or shorten your resume text and ensure your PDF pasted cleanly.",
        requestId,
        retryable: true,
        nextAction: "Retry improve",
      },
      { status: 500 }
    );
  }

  // Usage already logged by checkAndLogUsage above
  recordDailyActivity(user.id, "resume_improve").catch(() => {});

  const supabase = await createClient();
  let resumeIdToSave: string | null = null;
  if (resumeId) {
    const { data: resume } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();
    if (resume) resumeIdToSave = resume.id;
  }
  const { data: inserted } = await supabase
    .from("improved_resumes")
    .insert({
      user_id: user.id,
      resume_id: resumeIdToSave,
      improved_content: content,
      job_title: jobTitle || null,
      job_description: jobDescription ? jobDescription.slice(0, 5000) : null,
    })
    .select("id")
    .single();

  // Log activity (non-blocking)
  logActivity(
    user.id,
    "resume_improved",
    "Resume improved with AI",
    jobTitle ? `Tailored for: ${jobTitle}` : undefined,
    { improved_resume_id: inserted?.id },
    true
  ).catch(() => {});

  return NextResponse.json({
    ok: true,
    message: "Improved resume generated.",
    ...content,
    improvedResumeId: inserted?.id ?? undefined,
    meta: {
      requestId,
      nextStep: "Review improved resume and re-check ATS score",
    },
  });
}
