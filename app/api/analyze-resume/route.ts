import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rateLimit";
import { recordDailyActivity } from "@/lib/streakSystem";
import { validateTextLength } from "@/lib/validation";
import { runAtsAnalysisFromText } from "@/lib/ats-resume-analysis";
import { CREDITS_EXHAUSTED_CODE, isCreditsExhaustedError } from "@/lib/aiCreditError";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const {
    resumeText,
    resumeId,
    recheckAfterImprovement,
    previousAnalysis,
  } = body as {
    resumeText?: string;
    resumeId?: string;
    recheckAfterImprovement?: boolean;
    previousAnalysis?: { atsScore?: number; missingSkills?: string[]; resumeImprovements?: string[] };
  };

  const textValidation = validateTextLength(resumeText, 50000, "resumeText");
  if (!textValidation.valid) {
    return NextResponse.json({ error: textValidation.error }, { status: 400 });
  }

  const planType = user.profile?.plan_type ?? "free";
  const { allowed, used, limit } = await checkAndLogUsage(user.id, "resume_analysis", planType);
  if (!allowed) {
    return NextResponse.json(
      { error: "Free limit reached for resume analysis. Upgrade to Pro for unlimited." },
      { status: 403 }
    );
  }

  const text = textValidation.text;
  let data;
  try {
    data = await runAtsAnalysisFromText(text, {
      userId: user.id,
      recheckAfterImprovement: !!recheckAfterImprovement,
      previousAnalysis,
    });
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
    console.error("Analyze resume error:", e);
    return NextResponse.json(
      {
        error: "Analysis failed",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }

  recordDailyActivity(user.id, "resume_analyze").catch(() => {});

  const supabase = await createClient();
  if (resumeId) {
    const { data: resume } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();
    if (resume) {
      await supabase.from("resume_analysis").insert({
        resume_id: resume.id,
        score: data.atsScore,
        analysis_json: data,
      });
    }
  }

  return NextResponse.json({ ...data, _usage: { used, limit } });
}
