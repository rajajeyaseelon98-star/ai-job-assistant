import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cachedAiGenerateJsonWithGuard } from "@/lib/ai";
import { isValidUUID } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rateLimit";
import { buildStructuredPrompt } from "@/lib/aiPromptFactory";
import { sanitizeResumeForAi, sanitizeTextForAi } from "@/lib/aiInputSanitizer";
import { CREDITS_EXHAUSTED_CODE, isCreditsExhaustedError } from "@/lib/aiCreditError";

const SHORTLIST_PROMPT = buildStructuredPrompt({
  role: "batch candidate screener",
  task: "Score each candidate against the job and recommend shortlist decisions.",
  schema: `{
  "candidates":[{"application_id":"","score":0,"shortlist":false,"reason":"","confidence":0}]
}`,
  constraints: [
    "Return one result per input candidate id",
    "score integer 0..100",
    "confidence integer 0..100",
    "shortlist true only when score >= 70",
    "reason max 20 words",
  ],
});

const BATCH_SIZE = 10;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch the job posting (must belong to recruiter)
  const { data: job, error: jobError } = await supabase
    .from("job_postings")
    .select("id, title, description, requirements, skills_required, experience_min, experience_max")
    .eq("id", id)
    .eq("recruiter_id", user.id)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
  }

  // Fetch all applications at "applied" stage with resume text and candidate info
  const { data: applications, error: appError } = await supabase
    .from("job_applications")
    .select("id, resume_text, candidate:users!job_applications_candidate_id_fkey(name, email)")
    .eq("job_id", id)
    .eq("stage", "applied")
    .not("resume_text", "is", null);

  if (appError) {
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }

  if (!applications || applications.length === 0) {
    return NextResponse.json({ shortlisted: 0, total_screened: 0 });
  }

  const jobContext = `Job Title: ${job.title}
Description: ${sanitizeTextForAi(job.description || "", 3000)}
Requirements: ${sanitizeTextForAi(job.requirements || "", 2000)}
Required Skills: ${JSON.stringify(job.skills_required || [])}
Experience: ${job.experience_min || 0}-${job.experience_max || "any"} years`;

  let totalShortlisted = 0;
  let totalScreened = 0;

  // Process in batches
  for (let i = 0; i < applications.length; i += BATCH_SIZE) {
    const batch = applications.slice(i, i + BATCH_SIZE);

    const candidatesList = batch
      .map(
        (app, idx) => {
          const candidate = app.candidate as unknown as { name: string | null; email: string } | null;
          return `--- Candidate ${idx + 1} (ID: ${app.id}) ---
Name: ${candidate?.name || candidate?.email || "Unknown"}
Resume:
${sanitizeResumeForAi((app.resume_text as string) || "", 3000)}`;
        }
      )
      .join("\n\n");

    const content = `${jobContext}

=== CANDIDATES ===
${candidatesList}`;

    try {
      const result = await cachedAiGenerateJsonWithGuard<{
        candidates: Array<{
          application_id: string;
          score: number;
          shortlist: boolean;
          reason: string;
          confidence: number;
        }>;
      }>({
        systemPrompt: SHORTLIST_PROMPT,
        userContent: content,
        cacheFeature: "recruiter_auto_shortlist",
        featureName: "auto_shortlist",
        userId: user.id,
        rolloutKey: user.id,
        telemetryTag: "recruiter_auto_shortlist",
        normalize: (input) => {
          const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
          const candidatesRaw = Array.isArray(raw.candidates) ? raw.candidates : [];
          return {
            candidates: candidatesRaw.map((candidate) => {
              const c = typeof candidate === "object" && candidate !== null
                ? (candidate as Record<string, unknown>)
                : {};
              return {
                application_id: String(c.application_id || ""),
                score: Math.max(0, Math.min(100, Math.round(Number(c.score) || 0))),
                shortlist: Boolean(c.shortlist),
                reason: typeof c.reason === "string" ? c.reason.slice(0, 1000) : "",
                confidence: Math.max(0, Math.min(100, Math.round(Number(c.confidence) || 0))),
              };
            }),
          };
        },
        retries: 1,
      });

      if (!Array.isArray(result.candidates)) continue;

      // Update each application with score and potentially shortlist
      for (const candidate of result.candidates) {
        if (!candidate.application_id || !isValidUUID(candidate.application_id)) continue;

        const score = typeof candidate.score === "number"
          ? Math.min(100, Math.max(0, Math.round(candidate.score)))
          : 0;
        const shouldShortlist = candidate.shortlist === true && score >= 70;

        const updates: Record<string, unknown> = {
          match_score: score,
          ai_summary: typeof candidate.reason === "string" ? candidate.reason.slice(0, 1000) : null,
          updated_at: new Date().toISOString(),
        };

        if (shouldShortlist) {
          updates.stage = "shortlisted";
          totalShortlisted++;
        }

        await supabase
          .from("job_applications")
          .update(updates)
          .eq("id", candidate.application_id)
          .eq("job_id", id);

        totalScreened++;
      }
    } catch (e) {
      if (isCreditsExhaustedError(e)) {
        return NextResponse.json(
          {
            error: CREDITS_EXHAUSTED_CODE,
            message: "You have reached your AI credit limit. Please upgrade.",
          },
          { status: 402 }
        );
      }
      console.error("AI auto-shortlist batch error:", e);
      // Continue with next batch even if one fails
    }
  }

  return NextResponse.json({
    shortlisted: totalShortlisted,
    total_screened: totalScreened,
  });
}
