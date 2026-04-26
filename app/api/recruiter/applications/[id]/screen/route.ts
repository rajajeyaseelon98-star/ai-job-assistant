import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cachedAiGenerateJsonWithGuard } from "@/lib/ai";
import { isValidUUID } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import type { AIScreening } from "@/types/recruiter";
import { buildStructuredPrompt } from "@/lib/aiPromptFactory";
import { sanitizeResumeForAi, sanitizeTextForAi } from "@/lib/aiInputSanitizer";
import { CREDITS_EXHAUSTED_CODE, isCreditsExhaustedError } from "@/lib/aiCreditError";

const SCREENING_PROMPT = buildStructuredPrompt({
  role: "recruiter candidate screener",
  task: "Screen candidate resume against the provided job requirements.",
  schema: `{
  "experience_years":0,
  "key_skills":[],
  "strengths":[],
  "weaknesses":[],
  "ats_score":0,
  "recommendation":"strong_yes|yes|maybe|no",
  "summary":"",
  "confidence":0
}`,
  constraints: [
    "experience_years integer 0..50",
    "ats_score integer 0..100",
    "confidence integer 0..100",
    "recommendation must be one of: strong_yes, yes, maybe, no",
    "key_skills max 15 strings",
    "strengths max 5 strings",
    "weaknesses max 5 strings",
    "summary max 45 words",
  ],
});

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = crypto.randomUUID();
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized", requestId, retryable: false }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required", requestId, retryable: false }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests.", requestId, retryable: true, nextAction: "Retry shortly" },
      { status: 429 }
    );
  }

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID", requestId, retryable: false }, { status: 400 });

  const supabase = await createClient();

  // Get the application with resume and job details
  const { data: app, error } = await supabase
    .from("job_applications")
    .select(`
      id, resume_text,
      job:job_postings!job_applications_job_id_fkey(title, description, skills_required, experience_min, experience_max)
    `)
    .eq("id", id)
    .eq("recruiter_id", user.id)
    .single();

  if (error || !app) return NextResponse.json({ error: "Application not found", requestId, retryable: false }, { status: 404 });

  const job = app.job as unknown as Record<string, unknown>;
  if (!app.resume_text) {
    return NextResponse.json(
      { error: "No resume text available for screening", requestId, retryable: false },
      { status: 400 }
    );
  }

  const content = `Job Title: ${String(job.title || "")}
Job Description: ${sanitizeTextForAi(String(job.description || ""), 3000)}
Required Skills: ${JSON.stringify(job.skills_required || [])}
Experience Required: ${job.experience_min || 0}-${job.experience_max || "any"} years

---

Candidate Resume:
${sanitizeResumeForAi(app.resume_text as string, 6000)}`;

  let screening: AIScreening;
  try {
    screening = await cachedAiGenerateJsonWithGuard<AIScreening>({
      systemPrompt: SCREENING_PROMPT,
      userContent: content,
      cacheFeature: "recruiter_candidate_screening",
      featureName: "recruiter_candidate_screening",
      userId: user.id,
      rolloutKey: user.id,
      telemetryTag: "recruiter_candidate_screening",
      normalize: (input) => {
        const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
        const recommendationRaw = String(raw.recommendation || "").toLowerCase();
        const recommendation: AIScreening["recommendation"] = (
          ["strong_yes", "yes", "maybe", "no"].includes(recommendationRaw) ? recommendationRaw : "maybe"
        ) as AIScreening["recommendation"];
        return {
          experience_years: Math.max(0, Math.min(50, Math.round(Number(raw.experience_years) || 0))),
          key_skills: Array.isArray(raw.key_skills) ? raw.key_skills.map(String).slice(0, 15) : [],
          strengths: Array.isArray(raw.strengths) ? raw.strengths.map(String).slice(0, 5) : [],
          weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses.map(String).slice(0, 5) : [],
          ats_score: Math.max(0, Math.min(100, Math.round(Number(raw.ats_score) || 0))),
          recommendation,
          summary: typeof raw.summary === "string" ? raw.summary.slice(0, 1000) : "",
          confidence: Math.max(0, Math.min(100, Math.round(Number(raw.confidence) || 0))),
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
    console.error("AI screening error:", e);
    return NextResponse.json(
      { error: "Screening failed", requestId, retryable: true, nextAction: "Retry screening" },
      { status: 500 }
    );
  }

  // Save screening results to the application
  await supabase
    .from("job_applications")
    .update({
      ai_screening: screening,
      ai_summary: screening.summary,
      match_score: screening.ats_score,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("recruiter_id", user.id);

  return NextResponse.json({
    ok: true,
    message: "Candidate screening completed.",
    ...screening,
    meta: {
      requestId,
      nextStep: "Review strengths/weaknesses and move candidate stage",
    },
  });
}
