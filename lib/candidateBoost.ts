import { createClient } from "@/lib/supabase/server";

export interface CandidateRanking {
  user_id: string;
  name: string;
  headline: string | null;
  rank_score: number;
  is_boosted: boolean;
  top_skills: string[];
  ats_score: number | null;
}

/**
 * Activate a candidate boost (premium feature).
 * Boosted candidates appear higher in recruiter searches.
 */
export async function activateBoost(
  userId: string,
  durationDays: number = 7,
  multiplier: number = 2.0
): Promise<{ success: boolean; expires_at: string }> {
  const supabase = await createClient();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  await supabase
    .from("users")
    .update({
      is_boosted: true,
      boost_expires_at: expiresAt.toISOString(),
      boost_multiplier: multiplier,
    })
    .eq("id", userId);

  return { success: true, expires_at: expiresAt.toISOString() };
}

/**
 * Check and expire boost if past expiration.
 */
export async function checkBoostStatus(userId: string): Promise<{
  is_boosted: boolean;
  expires_at: string | null;
  multiplier: number;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("is_boosted, boost_expires_at, boost_multiplier")
    .eq("id", userId)
    .single();

  if (!data) return { is_boosted: false, expires_at: null, multiplier: 1.0 };

  // Auto-expire boost
  if (data.is_boosted && data.boost_expires_at) {
    if (new Date(data.boost_expires_at) < new Date()) {
      await supabase
        .from("users")
        .update({ is_boosted: false, boost_multiplier: 1.0 })
        .eq("id", userId);

      // Also revert pro trial if plan_type is "pro" and trial expired
      // (Pro trials use boost_expires_at as the trial expiry marker)
      const { data: planData } = await supabase
        .from("users")
        .select("plan_type")
        .eq("id", userId)
        .single();
      if (planData?.plan_type === "pro") {
        // Check if user has an active subscription — if not, revert to free
        const { count: activeSubs } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "active");
        if (!activeSubs || activeSubs === 0) {
          await supabase
            .from("users")
            .update({ plan_type: "free" })
            .eq("id", userId);
        }
      }

      return { is_boosted: false, expires_at: null, multiplier: 1.0 };
    }
  }

  return {
    is_boosted: data.is_boosted || false,
    expires_at: data.boost_expires_at,
    multiplier: Number(data.boost_multiplier) || 1.0,
  };
}

/**
 * Calculate and update candidate rank score.
 * Used for "Top Candidates" feature.
 */
export async function updateCandidateRank(userId: string): Promise<number> {
  const supabase = await createClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Run all independent queries in parallel
  const [
    { data: user },
    { data: userResumes },
    { count: skillsCount },
    { count: recentActivity },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("profile_strength, is_boosted, boost_multiplier")
      .eq("id", userId)
      .single(),
    supabase.from("resumes").select("id").eq("user_id", userId),
    supabase
      .from("candidate_skills")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("activity_feed")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString()),
  ]);

  const resumeIds = (userResumes || []).map((r) => r.id);
  let bestAtsScore = 0;
  if (resumeIds.length > 0) {
    const { data: analyses } = await supabase
      .from("resume_analysis")
      .select("score")
      .in("resume_id", resumeIds)
      .order("score", { ascending: false })
      .limit(1);
    bestAtsScore = analyses?.[0]?.score || 0;
  }

  const profileStrength = user?.profile_strength || 0;
  const atsScore = bestAtsScore;
  const skills = Math.min(skillsCount || 0, 30); // Cap at 30
  const activity = Math.min(recentActivity || 0, 50); // Cap at 50

  let rankScore =
    profileStrength * 0.25 +
    atsScore * 0.30 +
    (skills / 30) * 100 * 0.25 +
    (activity / 50) * 100 * 0.20;

  // Apply boost multiplier
  const multiplier = Number(user?.boost_multiplier) || 1.0;
  if (user?.is_boosted) {
    rankScore = Math.min(100, rankScore * multiplier);
  }

  rankScore = Math.round(rankScore * 100) / 100;

  // Update user record
  await supabase
    .from("users")
    .update({
      candidate_rank_score: rankScore,
      last_active_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return rankScore;
}

/**
 * Get top-ranked candidates (for recruiter "Top Candidates" feature).
 */
export async function getTopCandidates(
  limit = 20,
  skills?: string[]
): Promise<CandidateRanking[]> {
  const supabase = await createClient();

  const query = supabase
    .from("users")
    .select("id, name, headline, candidate_rank_score, is_boosted")
    .eq("profile_visible", true)
    .order("candidate_rank_score", { ascending: false })
    .limit(limit);

  const { data } = await query;
  if (!data || data.length === 0) return [];

  const userIds = data.map((u) => u.id);

  // Batch-fetch skills and resumes for ALL users at once (eliminates N+1)
  const [{ data: allSkills }, { data: allResumes }] = await Promise.all([
    supabase
      .from("candidate_skills")
      .select("user_id, skill, years_experience")
      .in("user_id", userIds)
      .order("years_experience", { ascending: false }),
    supabase.from("resumes").select("id, user_id").in("user_id", userIds),
  ]);

  const skillsByUser = new Map<string, string[]>();
  for (const s of allSkills || []) {
    const arr = skillsByUser.get(s.user_id) || [];
    if (arr.length < 5) arr.push(s.skill);
    skillsByUser.set(s.user_id, arr);
  }

  const resumeIdsByUser = new Map<string, string[]>();
  for (const r of allResumes || []) {
    const arr = resumeIdsByUser.get(r.user_id) || [];
    arr.push(r.id);
    resumeIdsByUser.set(r.user_id, arr);
  }

  // Batch-fetch ATS scores for all resume IDs
  const allResumeIds = (allResumes || []).map((r) => r.id);
  let atsScoreByResumeId = new Map<string, number>();
  if (allResumeIds.length > 0) {
    const { data: allAnalyses } = await supabase
      .from("resume_analysis")
      .select("resume_id, score")
      .in("resume_id", allResumeIds);
    for (const a of allAnalyses || []) {
      const current = atsScoreByResumeId.get(a.resume_id) || 0;
      if (a.score > current) atsScoreByResumeId.set(a.resume_id, a.score);
    }
  }

  const results: CandidateRanking[] = [];
  for (const user of data) {
    const topSkills = skillsByUser.get(user.id) || [];

    if (skills && skills.length > 0) {
      const normalizedRequired = skills.map((s) => s.toLowerCase());
      const normalizedUserSkills = topSkills.map((s) => s.toLowerCase());
      const hasMatch = normalizedRequired.some((req) =>
        normalizedUserSkills.some((us) => us.includes(req) || req.includes(us))
      );
      if (!hasMatch) continue;
    }

    const userResumeIds = resumeIdsByUser.get(user.id) || [];
    let userAtsScore: number | null = null;
    for (const rId of userResumeIds) {
      const score = atsScoreByResumeId.get(rId);
      if (score !== undefined && (userAtsScore === null || score > userAtsScore)) {
        userAtsScore = score;
      }
    }

    results.push({
      user_id: user.id,
      name: user.name || "Anonymous",
      headline: user.headline,
      rank_score: user.candidate_rank_score || 0,
      is_boosted: user.is_boosted || false,
      top_skills: topSkills,
      ats_score: userAtsScore,
    });
  }

  return results;
}
