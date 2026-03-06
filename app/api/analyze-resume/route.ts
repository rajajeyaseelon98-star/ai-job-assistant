import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canUseFeature, logUsage } from "@/lib/usage";
import { geminiGenerateContent } from "@/lib/gemini";
import type { ATSAnalysisResult } from "@/types/resume";

const PROMPT = `You are an ATS resume analyzer.

Analyze the resume and return ONLY JSON.

Return format:

{
  "atsScore": number,
  "missingSkills": [],
  "resumeImprovements": [],
  "recommendedRoles": []
}

Rules:
- atsScore between 0-100
- missingSkills maximum 10
- resumeImprovements maximum 10
- recommendedRoles maximum 5
- Return ONLY JSON (no explanations)

Resume:
`;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planType = user.profile?.plan_type ?? "free";
  const { allowed } = await canUseFeature(user.id, "resume_analysis", planType);
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
  let raw: string;
  try {
    raw = await geminiGenerateContent(PROMPT + text);
  } catch (e) {
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

  let data: ATSAnalysisResult;
  try {
    let jsonStr = raw.trim();
    const jsonMatch = jsonStr.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();
    data = JSON.parse(jsonStr) as ATSAnalysisResult;
    data.atsScore = Math.min(100, Math.max(0, Number(data.atsScore) || 0));
    data.missingSkills = Array.isArray(data.missingSkills) ? data.missingSkills.slice(0, 10) : [];
    data.resumeImprovements = Array.isArray(data.resumeImprovements) ? data.resumeImprovements.slice(0, 10) : [];
    data.recommendedRoles = Array.isArray(data.recommendedRoles) ? data.recommendedRoles.slice(0, 5) : [];
  } catch (e) {
    console.error("Parse analysis JSON error:", e);
    return NextResponse.json(
      { error: "Analysis failed", detail: "Invalid JSON from AI." },
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
        score: data.atsScore,
        analysis_json: data,
      });
    }
  }

  return NextResponse.json(data);
}
