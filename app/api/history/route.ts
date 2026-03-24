import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();

  const [
    { data: analyses },
    { data: matches },
    { data: coverLetters },
    { data: improvedResumes },
  ] = await Promise.all([
    supabase
      .from("resume_analysis")
      .select("id, score, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("job_matches")
      .select("id, match_score, job_title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("cover_letters")
      .select("id, company_name, job_title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("improved_resumes")
      .select("id, job_title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    analyses: analyses ?? [],
    matches: matches ?? [],
    coverLetters: coverLetters ?? [],
    improvedResumes: improvedResumes ?? [],
  });
}
