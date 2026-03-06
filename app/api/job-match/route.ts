import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canUseFeature, logUsage } from "@/lib/usage";
import { chatCompletion } from "@/lib/openai";
import type { JobMatchResult } from "@/types/jobMatch";

const SYSTEM_PROMPT = `You are an expert job-resume matcher for software developers.
Given a resume and a job description, calculate:
1. job match score (0-100 integer)
2. missing skills (list of skills in the job that are weak or missing in the resume)
3. recommended keywords (phrases or terms to add to the resume for better ATS match)

Return ONLY valid JSON:
{
  "match_score": 68,
  "missing_skills": [],
  "recommended_keywords": []
}`;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planType = user.profile?.plan_type ?? "free";
  const { allowed } = await canUseFeature(user.id, "job_match", planType);
  if (!allowed) {
    return NextResponse.json(
      { error: "Free limit reached for job match. Upgrade to Pro for unlimited." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { resumeText, jobDescription, resumeId } = body as {
    resumeText?: string;
    jobDescription?: string;
    resumeId?: string;
  };
  if (!resumeText || !jobDescription) {
    return NextResponse.json(
      { error: "resumeText and jobDescription are required" },
      { status: 400 }
    );
  }

  const content = `Resume:\n${resumeText.slice(0, 8000)}\n\nJob description:\n${jobDescription.slice(0, 6000)}`;
  let result: JobMatchResult;
  try {
    const raw = await chatCompletion(SYSTEM_PROMPT, content, { jsonMode: true });
    result = JSON.parse(raw) as JobMatchResult;
    if (typeof result.match_score !== "number") result.match_score = 0;
    if (!Array.isArray(result.missing_skills)) result.missing_skills = [];
    if (!Array.isArray(result.recommended_keywords)) result.recommended_keywords = [];
  } catch (e) {
    console.error("Job match error:", e);
    return NextResponse.json(
      { error: "Match failed" },
      { status: 500 }
    );
  }

  await logUsage(user.id, "job_match");

  const supabase = await createClient();
  if (resumeId) {
    const { data: resume } = await supabase
      .from("resumes")
      .select("id")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .single();
    if (resume) {
      await supabase.from("job_matches").insert({
        resume_id: resume.id,
        job_description: jobDescription.slice(0, 5000),
        match_score: result.match_score,
        missing_skills: result.missing_skills,
      });
    }
  }

  return NextResponse.json(result);
}
