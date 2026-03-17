import { createClient } from "@/lib/supabase/server";

export interface ResumePerformanceData {
  resume_id: string;
  version_label: string | null;
  target_role: string | null;
  total_applications: number;
  total_interviews: number;
  total_offers: number;
  total_rejections: number;
  interview_rate: number; // %
  offer_rate: number; // %
  avg_match_score: number;
  best_for_roles: string[];
}

export interface ApplySuccessIntelligence {
  resume_versions: ResumePerformanceData[];
  best_resume_id: string | null;
  best_resume_label: string | null;
  best_interview_rate: number;
  insights: string[];
  score_threshold_insight: string | null;
  optimal_daily_apply_count: number;
  role_recommendations: Array<{ role: string; interview_rate: number }>;
}

/**
 * Calculate performance metrics for each resume version.
 * Core Data Moat: tracks which resume version gets the most interviews.
 */
export async function getResumePerformance(userId: string): Promise<ApplySuccessIntelligence> {
  const supabase = await createClient();

  // Get all resumes with applications
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, version_label, target_role")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!resumes || resumes.length === 0) {
    return emptyResult();
  }

  // Get all applications for this user
  const { data: allApps } = await supabase
    .from("applications")
    .select("id, role, status, notes, applied_date")
    .eq("user_id", userId);

  // Get auto-apply runs to link resume_id to applications
  const { data: runs } = await supabase
    .from("auto_apply_runs")
    .select("id, resume_id, results, status")
    .eq("user_id", userId)
    .eq("status", "completed");

  // Build resume → applications mapping
  const resumeApps = new Map<string, typeof allApps>();
  const appRoles = new Map<string, { role: string; status: string }[]>();

  // Map auto-apply runs to resumes
  for (const run of runs || []) {
    if (!run.resume_id || !run.results) continue;
    const results = run.results as Array<{ applied: boolean; title: string; match_score: number }>;
    const applied = results.filter((r) => r.applied);
    const existing = resumeApps.get(run.resume_id) || [];
    // Create synthetic app entries for auto-applied jobs
    for (const app of applied) {
      existing.push({
        id: `auto_${run.id}_${app.title}`,
        role: app.title,
        status: "applied",
        notes: `Match score: ${app.match_score}%`,
        applied_date: null,
      } as unknown as (typeof allApps extends Array<infer T> | null ? T : never));
    }
    resumeApps.set(run.resume_id, existing);
  }

  // Also distribute manual applications (heuristic: assign to most recent resume)
  const manualApps = (allApps || []).filter((a) => {
    // Check if not already counted in auto-apply
    return !a.notes?.includes("Auto-applied via AI Auto-Apply");
  });

  if (resumes.length > 0 && manualApps.length > 0) {
    const primaryResume = resumes[0]; // Most recent
    const existing = resumeApps.get(primaryResume.id) || [];
    existing.push(...(manualApps as typeof existing));
    resumeApps.set(primaryResume.id, existing);
  }

  // Calculate per-resume performance
  const versions: ResumePerformanceData[] = [];
  for (const resume of resumes) {
    const apps = resumeApps.get(resume.id) || [];
    const total = apps.length;
    if (total === 0) {
      versions.push({
        resume_id: resume.id,
        version_label: resume.version_label,
        target_role: resume.target_role,
        total_applications: 0,
        total_interviews: 0,
        total_offers: 0,
        total_rejections: 0,
        interview_rate: 0,
        offer_rate: 0,
        avg_match_score: 0,
        best_for_roles: [],
      });
      continue;
    }

    const interviews = apps.filter((a) =>
      ["interviewing", "offer"].includes(a.status)
    ).length;
    const offers = apps.filter((a) => a.status === "offer").length;
    const rejections = apps.filter((a) => a.status === "rejected").length;

    // Extract match scores from notes
    const scores: number[] = [];
    for (const a of apps) {
      const scoreMatch = a.notes?.match(/Match score:\s*(\d+)%/);
      if (scoreMatch) scores.push(parseInt(scoreMatch[1]));
    }
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Best roles (where interviews happened)
    const roleSuccess = new Map<string, number>();
    for (const a of apps) {
      if (["interviewing", "offer"].includes(a.status) && a.role) {
        roleSuccess.set(a.role, (roleSuccess.get(a.role) || 0) + 1);
      }
    }
    const bestRoles = [...roleSuccess.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([role]) => role);

    versions.push({
      resume_id: resume.id,
      version_label: resume.version_label,
      target_role: resume.target_role,
      total_applications: total,
      total_interviews: interviews,
      total_offers: offers,
      total_rejections: rejections,
      interview_rate: total > 0 ? Math.round((interviews / total) * 100) : 0,
      offer_rate: total > 0 ? Math.round((offers / total) * 100) : 0,
      avg_match_score: avgScore,
      best_for_roles: bestRoles,
    });
  }

  // Determine best resume version
  const withApps = versions.filter((v) => v.total_applications >= 3);
  const bestVersion = withApps.length > 0
    ? withApps.reduce((best, v) => v.interview_rate > best.interview_rate ? v : best, withApps[0])
    : null;

  // Score threshold insight
  let scoreThreshold: string | null = null;
  const allAppsList = allApps || [];
  const highScoreApps = allAppsList.filter((a) => {
    const match = a.notes?.match(/Match score:\s*(\d+)%/);
    return match && parseInt(match[1]) >= 80;
  });
  const lowScoreApps = allAppsList.filter((a) => {
    const match = a.notes?.match(/Match score:\s*(\d+)%/);
    return match && parseInt(match[1]) < 80;
  });

  if (highScoreApps.length >= 3 && lowScoreApps.length >= 3) {
    const highInterviewRate = highScoreApps.filter((a) =>
      ["interviewing", "offer"].includes(a.status)
    ).length / highScoreApps.length;
    const lowInterviewRate = lowScoreApps.filter((a) =>
      ["interviewing", "offer"].includes(a.status)
    ).length / lowScoreApps.length;

    if (highInterviewRate > lowInterviewRate * 1.5) {
      const multiplier = lowInterviewRate > 0
        ? (highInterviewRate / lowInterviewRate).toFixed(1)
        : "much higher";
      scoreThreshold = `Jobs above 80% match score have ${multiplier}x interview rate`;
    }
  }

  // Role-based recommendations
  const roleMap = new Map<string, { total: number; interviews: number }>();
  for (const a of allAppsList) {
    if (!a.role) continue;
    const existing = roleMap.get(a.role) || { total: 0, interviews: 0 };
    existing.total++;
    if (["interviewing", "offer"].includes(a.status)) existing.interviews++;
    roleMap.set(a.role, existing);
  }

  const roleRecs = [...roleMap.entries()]
    .filter(([, v]) => v.total >= 2)
    .map(([role, v]) => ({
      role,
      interview_rate: Math.round((v.interviews / v.total) * 100),
    }))
    .sort((a, b) => b.interview_rate - a.interview_rate)
    .slice(0, 5);

  // Generate insights
  const insights: string[] = [];
  if (bestVersion) {
    const label = bestVersion.version_label || "your latest resume";
    insights.push(
      `Best performing resume: "${label}" with ${bestVersion.interview_rate}% interview rate`
    );
  }
  if (scoreThreshold) {
    insights.push(scoreThreshold);
  }
  if (roleRecs.length > 0 && roleRecs[0].interview_rate > 0) {
    insights.push(
      `Best role: "${roleRecs[0].role}" — ${roleRecs[0].interview_rate}% interview rate`
    );
  }

  // Optimal daily count (based on diminishing returns)
  const totalApps = allAppsList.length;
  let optimalDaily = 10;
  if (totalApps >= 50) {
    // If many apps with low interview rate, recommend fewer, more targeted
    const overallRate = allAppsList.filter((a) =>
      ["interviewing", "offer"].includes(a.status)
    ).length / totalApps;
    if (overallRate < 0.1) {
      optimalDaily = 5;
      insights.push("Focus on fewer, high-quality applications rather than volume");
    } else if (overallRate >= 0.3) {
      optimalDaily = 15;
      insights.push("Your strategy is working — increase application volume");
    }
  }

  return {
    resume_versions: versions,
    best_resume_id: bestVersion?.resume_id || null,
    best_resume_label: bestVersion?.version_label || null,
    best_interview_rate: bestVersion?.interview_rate || 0,
    insights,
    score_threshold_insight: scoreThreshold,
    optimal_daily_apply_count: optimalDaily,
    role_recommendations: roleRecs,
  };
}

/**
 * Get candidate's hiring benchmark — percentile rank vs other candidates.
 */
export async function getHiringBenchmark(userId: string): Promise<{
  percentile: number;
  total_candidates: number;
  your_score: number;
  avg_score: number;
  top_factor: string;
}> {
  const supabase = await createClient();

  // Get user's rank score
  const { data: user } = await supabase
    .from("users")
    .select("candidate_rank_score, profile_strength")
    .eq("id", userId)
    .single();

  const yourScore = user?.candidate_rank_score || user?.profile_strength || 0;

  // Count candidates with lower scores
  const { count: totalCandidates } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("candidate_rank_score", 0);

  const { count: lowerCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("candidate_rank_score", 0)
    .lt("candidate_rank_score", yourScore);

  const total = totalCandidates || 1;
  const percentile = Math.round(((lowerCount || 0) / total) * 100);

  // Get average score
  const { data: avgData } = await supabase
    .from("users")
    .select("candidate_rank_score")
    .gt("candidate_rank_score", 0)
    .limit(500);

  let avgScore = 0;
  if (avgData && avgData.length > 0) {
    avgScore = Math.round(
      avgData.reduce((s, u) => s + (u.candidate_rank_score || 0), 0) / avgData.length
    );
  }

  // Determine top factor
  let topFactor = "Complete your profile to improve your ranking";
  if (yourScore >= 80) topFactor = "Your strong ATS score and active profile set you apart";
  else if (yourScore >= 60) topFactor = "Adding more skills will boost your ranking";
  else if (yourScore >= 40) topFactor = "Improve your ATS score to climb the rankings";

  return {
    percentile,
    total_candidates: total,
    your_score: Math.round(yourScore),
    avg_score: avgScore,
    top_factor: topFactor,
  };
}

function emptyResult(): ApplySuccessIntelligence {
  return {
    resume_versions: [],
    best_resume_id: null,
    best_resume_label: null,
    best_interview_rate: 0,
    insights: ["Upload a resume and start applying to see performance data"],
    score_threshold_insight: null,
    optimal_daily_apply_count: 10,
    role_recommendations: [],
  };
}
