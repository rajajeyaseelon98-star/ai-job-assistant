import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cachedAiGenerateJsonWithGuard } from "@/lib/ai";
import { isValidUUID, validateTextLength } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { buildStructuredPrompt } from "@/lib/aiPromptFactory";
import { sanitizeResumeForAi, sanitizeTextForAi } from "@/lib/aiInputSanitizer";
import { CREDITS_EXHAUSTED_CODE, isCreditsExhaustedError } from "@/lib/aiCreditError";

const SKILL_GAP_PROMPT = buildStructuredPrompt({
  role: "career skill-gap assessor",
  task: "Compare candidate profile and job requirements to produce a skill-gap plan.",
  schema: `{
  "matching_skills":[],
  "missing_skills":[],
  "transferable_skills":[],
  "recommendations":[],
  "gap_score":0,
  "confidence":0
}`,
  constraints: [
    "matching_skills max 20 strings",
    "missing_skills max 15 strings",
    "transferable_skills max 10 strings",
    "recommendations max 8 strings",
    "gap_score integer 0..100",
    "confidence integer 0..100",
  ],
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", requestId, retryable: false }, { status: 401 });
  }
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden", requestId, retryable: false }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests.", requestId, retryable: true, nextAction: "Retry shortly" },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", requestId, retryable: false }, { status: 400 });
  }

  const supabase = await createClient();

  let resumeText: string;
  let jobTitle: string;
  let jobDescription: string;
  let jobRequirements: string;
  let jobSkills: string[];

  if (typeof body.application_id === "string" && body.application_id.trim()) {
    // Mode 1: Fetch from application_id
    if (!isValidUUID(body.application_id)) {
      return NextResponse.json({ error: "Invalid application_id", requestId, retryable: false }, { status: 400 });
    }

    const { data: app, error } = await supabase
      .from("job_applications")
      .select(`
        id, resume_text,
        job:job_postings!job_applications_job_id_fkey(title, description, requirements, skills_required)
      `)
      .eq("id", body.application_id)
      .eq("recruiter_id", user.id)
      .single();

    if (error || !app) {
      return NextResponse.json({ error: "Application not found", requestId, retryable: false }, { status: 404 });
    }
    if (!app.resume_text) {
      return NextResponse.json({ error: "No resume text available", requestId, retryable: false }, { status: 400 });
    }

    const job = app.job as unknown as Record<string, unknown>;
    resumeText = app.resume_text as string;
    jobTitle = (job.title as string) || "";
    jobDescription = (job.description as string) || "";
    jobRequirements = (job.requirements as string) || "";
    jobSkills = (job.skills_required as string[]) || [];
  } else if (typeof body.resume_text === "string" && typeof body.job_id === "string") {
    // Mode 2: Direct resume_text + job_id
    const resumeVal = validateTextLength(body.resume_text as string, 50000, "resume_text");
    if (!resumeVal.valid) {
      return NextResponse.json({ error: resumeVal.error, requestId, retryable: false }, { status: 400 });
    }
    if (!isValidUUID(body.job_id)) {
      return NextResponse.json({ error: "Invalid job_id", requestId, retryable: false }, { status: 400 });
    }

    const { data: job, error } = await supabase
      .from("job_postings")
      .select("title, description, requirements, skills_required")
      .eq("id", body.job_id)
      .eq("recruiter_id", user.id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: "Job posting not found", requestId, retryable: false }, { status: 404 });
    }

    resumeText = resumeVal.text;
    jobTitle = job.title || "";
    jobDescription = job.description || "";
    jobRequirements = job.requirements || "";
    jobSkills = (job.skills_required as string[]) || [];
  } else {
    return NextResponse.json(
      { error: "Provide either application_id or both resume_text and job_id", requestId, retryable: false },
      { status: 400 }
    );
  }

  const content = `Job Title: ${jobTitle}
Job Description: ${sanitizeTextForAi(jobDescription, 3000)}
Job Requirements: ${sanitizeTextForAi(jobRequirements, 2000)}
Required Skills: ${JSON.stringify(jobSkills)}

---

Candidate Resume:
${sanitizeResumeForAi(resumeText, 6000)}`;

  try {
    const result = await cachedAiGenerateJsonWithGuard<{
      matching_skills: string[];
      missing_skills: string[];
      transferable_skills: string[];
      recommendations: string[];
      gap_score: number;
      confidence: number;
    }>({
      systemPrompt: SKILL_GAP_PROMPT,
      userContent: content,
      cacheFeature: "recruiter_skill_gap",
      featureName: "recruiter_skill_gap",
      userId: user.id,
      rolloutKey: user.id,
      telemetryTag: "recruiter_skill_gap",
      normalize: (input) => {
        const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
        return {
          matching_skills: Array.isArray(raw.matching_skills) ? raw.matching_skills.map(String).slice(0, 20) : [],
          missing_skills: Array.isArray(raw.missing_skills) ? raw.missing_skills.map(String).slice(0, 15) : [],
          transferable_skills: Array.isArray(raw.transferable_skills)
            ? raw.transferable_skills.map(String).slice(0, 10)
            : [],
          recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.map(String).slice(0, 8) : [],
          gap_score: Math.min(100, Math.max(0, Math.round(Number(raw.gap_score) || 50))),
          confidence: Math.min(100, Math.max(0, Math.round(Number(raw.confidence) || 0))),
        };
      },
      retries: 1,
    });

    return NextResponse.json({
      ok: true,
      message: "Skill gap report generated.",
      matching_skills: Array.isArray(result.matching_skills) ? result.matching_skills.slice(0, 20) : [],
      missing_skills: Array.isArray(result.missing_skills) ? result.missing_skills.slice(0, 15) : [],
      transferable_skills: Array.isArray(result.transferable_skills) ? result.transferable_skills.slice(0, 10) : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations.slice(0, 8) : [],
      gap_score: typeof result.gap_score === "number"
        ? Math.min(100, Math.max(0, Math.round(result.gap_score)))
        : 50,
      confidence: typeof result.confidence === "number"
        ? Math.min(100, Math.max(0, Math.round(result.confidence)))
        : 0,
      meta: {
        requestId,
        nextStep: "Review missing skills and decide shortlist action",
      },
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
    console.error("AI skill gap analysis error:", e);
    return NextResponse.json(
      { error: "Skill gap analysis failed", requestId, retryable: true, nextAction: "Retry analysis" },
      { status: 500 }
    );
  }
}
