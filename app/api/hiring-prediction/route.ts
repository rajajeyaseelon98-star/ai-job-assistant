import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { predictHiringSuccess } from "@/lib/hiringPrediction";

/** POST /api/hiring-prediction — Get hiring success prediction */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    candidate_skills,
    job_title,
    job_skills_required,
    match_score,
    experience_years,
    required_experience,
  } = body as {
    candidate_skills?: string[];
    job_title?: string;
    job_skills_required?: string[];
    match_score?: number;
    experience_years?: number;
    required_experience?: number;
  };

  if (!job_title || !candidate_skills) {
    return NextResponse.json(
      { error: "job_title and candidate_skills are required" },
      { status: 400 }
    );
  }

  try {
    const prediction = await predictHiringSuccess(
      candidate_skills,
      job_title,
      job_skills_required || [],
      match_score || 0,
      experience_years || 0,
      required_experience
    );
    return NextResponse.json(prediction);
  } catch (err) {
    console.error("Hiring prediction error:", err);
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 });
  }
}
