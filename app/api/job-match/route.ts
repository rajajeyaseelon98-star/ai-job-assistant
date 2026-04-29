import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/usage";
import { cachedAiGenerateJsonWithGuard } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateTextLength } from "@/lib/validation";
import type { JobMatchResult } from "@/types/jobMatch";
import { buildStructuredPrompt } from "@/lib/aiPromptFactory";
import { AI_INPUT_BUDGETS, sanitizeResumeForAi, sanitizeTextForAi } from "@/lib/aiInputSanitizer";
import { CREDITS_EXHAUSTED_CODE, isCreditsExhaustedError } from "@/lib/aiCreditError";

const SYSTEM_PROMPT = buildStructuredPrompt({
  role: "resume-vs-job matcher",
  task: "Compare the resume and job description for fit.",
  schema: `{"match_score":0,"matched_skills":[],"missing_skills":[],"resume_improvements":[],"confidence":0}`,
  constraints: [
    "match_score integer 0..100",
    "confidence integer 0..100",
    "matched_skills max 15 strings",
    "missing_skills max 15 strings",
    "resume_improvements max 10 strings",
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
  const { resumeText, jobDescription, resumeId, jobTitle } = body as {
    resumeText?: string;
    jobDescription?: string;
    resumeId?: string;
    jobTitle?: string;
  };

  // Validate input sizes to prevent memory exhaustion
  const resumeValidation = validateTextLength(resumeText, 50000, "resumeText");
  if (!resumeValidation.valid) {
    return NextResponse.json({ error: resumeValidation.error, requestId, retryable: false }, { status: 400 });
  }
  const jobValidation = validateTextLength(jobDescription, 30000, "jobDescription");
  if (!jobValidation.valid) {
    return NextResponse.json({ error: jobValidation.error, requestId, retryable: false }, { status: 400 });
  }

  // Atomic usage check + log (BUG-002 fix)
  const planType = user.profile?.plan_type ?? "free";
  const { allowed } = await checkAndLogUsage(user.id, "job_match", planType);
  if (!allowed) {
    return NextResponse.json(
      { error: "Free limit reached for job match. Upgrade to Pro for unlimited." },
      { status: 403 }
    );
  }

  const safeResume = resumeValidation.text;
  const safeJobDesc = jobValidation.text;
  const resumeForAi = sanitizeResumeForAi(safeResume, AI_INPUT_BUDGETS.jobMatchResumeChars);
  const jobDescForAi = sanitizeTextForAi(safeJobDesc, AI_INPUT_BUDGETS.jobMatchJobDescriptionChars);
  const content = `Resume:\n${resumeForAi}\n\nJob description:\n${jobDescForAi}`;
  let result: JobMatchResult;
  try {
    result = await cachedAiGenerateJsonWithGuard<JobMatchResult>({
      systemPrompt: SYSTEM_PROMPT,
      userContent: content,
      cacheFeature: "job_match",
      featureName: "job_match",
      userId: user.id,
      rolloutKey: user.id,
      telemetryTag: "job_match",
      normalize: (input) => {
        const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
        return {
          match_score: Math.max(0, Math.min(100, Number(raw.match_score) || 0)),
          confidence: Math.max(0, Math.min(100, Number(raw.confidence) || 0)),
          matched_skills: Array.isArray(raw.matched_skills) ? raw.matched_skills.map(String).slice(0, 15) : [],
          missing_skills: Array.isArray(raw.missing_skills) ? raw.missing_skills.map(String).slice(0, 15) : [],
          resume_improvements: Array.isArray(raw.resume_improvements)
            ? raw.resume_improvements.map(String).slice(0, 10)
            : [],
        };
      },
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
    console.error("Job match error:", e);
    return NextResponse.json(
      { error: "Match failed", requestId, retryable: true, nextAction: "Retry job match" },
      { status: 500 }
    );
  }

  // Usage already logged by checkAndLogUsage above

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
  await supabase.from("job_matches").insert({
    user_id: user.id,
    resume_id: resumeIdToSave,
    job_description: safeJobDesc.slice(0, 5000),
    job_title: jobTitle?.trim() || null,
    resume_text: safeResume.slice(0, 10000),
    match_score: result.match_score,
    missing_skills: result.missing_skills,
    analysis: result,
  });

  return NextResponse.json({
    ok: true,
    message: "Job match generated.",
    ...result,
    meta: {
      requestId,
      nextStep: "Review missing skills and improve resume",
    },
  });
}
