import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidUUID, validateTextLength } from "@/lib/validation";
import { runAtsAnalysisFromText } from "@/lib/ats-resume-analysis";
import { CREDITS_EXHAUSTED_CODE, isCreditsExhaustedError } from "@/lib/aiCreditError";

/**
 * POST /api/recruiter/resumes/[resumeId]/analyze
 * Run ATS analysis on a job seeker's resume text; insert resume_analysis (charges recruiter usage).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ resumeId: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const { resumeId } = await params;
  if (!isValidUUID(resumeId)) {
    return NextResponse.json({ error: "Invalid resume ID" }, { status: 400 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: resume, error: resumeErr } = await supabase
    .from("resumes")
    .select("id, parsed_text, user_id")
    .eq("id", resumeId)
    .single();

  if (resumeErr || !resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const { data: owner } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", resume.user_id)
    .single();

  if (!owner || owner.role !== "job_seeker") {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const textValidation = validateTextLength(resume.parsed_text ?? "", 50000, "resumeText");
  if (!textValidation.valid || !textValidation.text.trim()) {
    return NextResponse.json(
      { error: "No extractable resume text. The candidate needs parsed resume content first." },
      { status: 400 }
    );
  }

  const planType = user.profile?.plan_type ?? "free";
  const { allowed, used, limit } = await checkAndLogUsage(user.id, "resume_analysis", planType);
  if (!allowed) {
    return NextResponse.json(
      { error: "Resume analysis limit reached for your plan. Upgrade for more." },
      { status: 403 }
    );
  }

  let data;
  try {
    data = await runAtsAnalysisFromText(textValidation.text, { userId: user.id });
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
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[recruiter/resumes/analyze]", e);
    return NextResponse.json(
      { error: "Analysis failed", detail: process.env.NODE_ENV === "development" ? message : undefined },
      { status: 500 }
    );
  }

  const { error: insErr } = await supabase.from("resume_analysis").insert({
    resume_id: resume.id,
    score: data.atsScore,
    analysis_json: data,
  });

  if (insErr) {
    console.error("[recruiter/resumes/analyze] insert", insErr.message);
    return NextResponse.json(
      {
        error: "Could not save analysis",
        detail: insErr.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ...data, _usage: { used, limit } });
}
