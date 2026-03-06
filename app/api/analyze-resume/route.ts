import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canUseFeature, logUsage } from "@/lib/usage";
import { chatCompletion } from "@/lib/openai";
import type { AnalysisResult } from "@/types/resume";

const SYSTEM_PROMPT = `You are an expert ATS resume reviewer.
Analyze the following software developer resume.
Provide:
1. ATS score out of 100 (integer)
2. Key strengths (array of short strings)
3. Weak sections (array of short strings)
4. Missing keywords (array of strings that would help ATS)
5. Suggestions to improve the resume (array of short strings)
Return ONLY valid JSON with this exact structure:
{
  "score": 72,
  "strengths": [],
  "weaknesses": [],
  "missing_keywords": [],
  "suggestions": []
}`;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planType = user.profile?.plan_type ?? "free";
  const { allowed, limit } = await canUseFeature(user.id, "resume_analysis", planType);
  if (!allowed) {
    return NextResponse.json(
      { error: "Free limit reached for resume analysis. Upgrade to Pro for unlimited." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { resumeText, resumeId } = body as { resumeText?: string; resumeId?: string };
  if (!resumeText || typeof resumeText !== "string") {
    return NextResponse.json(
      { error: "resumeText is required" },
      { status: 400 }
    );
  }

  const text = resumeText.slice(0, 15000);
  let result: AnalysisResult;
  try {
    const raw = await chatCompletion(SYSTEM_PROMPT, text, { jsonMode: true });
    result = JSON.parse(raw) as AnalysisResult;
    if (typeof result.score !== "number") result.score = 0;
    if (!Array.isArray(result.strengths)) result.strengths = [];
    if (!Array.isArray(result.weaknesses)) result.weaknesses = [];
    if (!Array.isArray(result.missing_keywords)) result.missing_keywords = [];
    if (!Array.isArray(result.suggestions)) result.suggestions = [];
  } catch (e) {
    console.error("AI parse error:", e);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }

  await logUsage(user.id, "resume_analysis");

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
        score: result.score,
        analysis_json: result,
      });
    }
  }

  return NextResponse.json(result);
}
