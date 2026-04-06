import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getUsageSummary } from "@/lib/usage";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planType = user.profile?.plan_type ?? "free";
  const supabase = await createClient();

  const [
    { data: analyses },
    { data: matches },
    { data: coverLetters },
    { count: applicationCount },
    { data: avgRow },
    usage,
  ] = await Promise.all([
    supabase
      .from("resume_analysis")
      .select("id, score, created_at, resumes!inner(user_id)")
      .eq("resumes.user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("job_matches")
      .select("id, match_score, job_title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("cover_letters")
      .select("id, company_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("job_matches")
      .select("match_score")
      .eq("user_id", user.id)
      .limit(1000),
    getUsageSummary(user.id, planType),
  ]);

  const matchScores = (avgRow ?? []).map((r) => r.match_score).filter((n) => typeof n === "number");
  const avgMatchScore =
    matchScores.length > 0 ? matchScores.reduce((a, b) => a + b, 0) / matchScores.length : null;

  return NextResponse.json({
    analyses: analyses ?? [],
    matches: matches ?? [],
    coverLetters: coverLetters ?? [],
    applicationCount: applicationCount ?? 0,
    avgMatchScore,
    usage,
    userName: user.profile?.name || user.email?.split("@")[0] || null,
    planType,
  });
}
