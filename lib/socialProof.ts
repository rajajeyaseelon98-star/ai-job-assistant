import { createClient } from "@/lib/supabase/server";

export interface PlatformStats {
  total_users: number;
  total_applications: number;
  total_interviews: number;
  total_hires: number;
  total_resumes_improved: number;
  avg_match_score: number;
  updated_at: string;
}

/**
 * Get cached platform-wide statistics for social proof displays.
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_stats")
    .select("*")
    .eq("id", "global")
    .single();

  if (data) return data as PlatformStats;

  return {
    total_users: 0,
    total_applications: 0,
    total_interviews: 0,
    total_hires: 0,
    total_resumes_improved: 0,
    avg_match_score: 0,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Refresh platform stats (called from cron or admin).
 * Aggregates across all users.
 */
export async function refreshPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient();

  // Count users
  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  // Count applications
  const { count: totalApps } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true });

  // Count interviews (stage = interviewed or later)
  const { count: totalInterviews } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .in("stage", ["interviewed", "offer_sent", "hired"]);

  // Count hires
  const { count: totalHires } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .eq("stage", "hired");

  // Count improved resumes
  const { count: totalImproved } = await supabase
    .from("improved_resumes")
    .select("*", { count: "exact", head: true });

  // Average match score
  const { data: scoreData } = await supabase
    .from("job_applications")
    .select("match_score")
    .not("match_score", "is", null)
    .limit(1000);

  let avgScore = 0;
  if (scoreData && scoreData.length > 0) {
    const sum = scoreData.reduce((acc, r) => acc + (r.match_score || 0), 0);
    avgScore = Math.round((sum / scoreData.length) * 100) / 100;
  }

  const stats: PlatformStats = {
    total_users: totalUsers || 0,
    total_applications: totalApps || 0,
    total_interviews: totalInterviews || 0,
    total_hires: totalHires || 0,
    total_resumes_improved: totalImproved || 0,
    avg_match_score: avgScore,
    updated_at: new Date().toISOString(),
  };

  // Upsert
  await supabase.from("platform_stats").upsert({
    id: "global",
    ...stats,
  });

  return stats;
}
