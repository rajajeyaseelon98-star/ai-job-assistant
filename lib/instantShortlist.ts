import { createClient } from "@/lib/supabase/server";

/**
 * Instant Shortlist Mode
 *
 * When a recruiter posts a job, instantly find the top matching candidates.
 * No AI cost — pure JS skill matching + ranking.
 *
 * Behind the scenes:
 * - Candidate graph (candidate_skills)
 * - Match score (skill overlap + profile strength + ATS)
 * - Ranking (weighted composite)
 */

export interface ShortlistCandidate {
  user_id: string;
  name: string;
  headline: string | null;
  match_score: number;
  skill_overlap: string[];
  missing_skills: string[];
  ats_score: number | null;
  profile_strength: number;
  rank_score: number;
  is_boosted: boolean;
  total_experience_years: number | null;
}

export interface InstantShortlistResult {
  job_title: string;
  candidates: ShortlistCandidate[];
  total_searched: number;
  search_time_ms: number;
}

/**
 * Find top matching candidates for a job posting instantly.
 * Called when recruiter posts a job or clicks "Find Candidates".
 */
export async function getInstantShortlist(
  jobTitle: string,
  jobSkills: string[],
  experienceMin?: number | null,
  experienceMax?: number | null,
  location?: string | null,
  limit: number = 10
): Promise<InstantShortlistResult> {
  const startTime = Date.now();
  const supabase = await createClient();
  const normalizedJobSkills = jobSkills.map((s) => s.toLowerCase().trim()).filter(Boolean);

  if (normalizedJobSkills.length === 0) {
    return { job_title: jobTitle, candidates: [], total_searched: 0, search_time_ms: 0 };
  }

  // Step 1: Find candidates who have ANY of the required skills
  const { data: skillMatches } = await supabase
    .from("candidate_skills")
    .select("user_id, skill")
    .in("skill_normalized", normalizedJobSkills);

  if (!skillMatches || skillMatches.length === 0) {
    return { job_title: jobTitle, candidates: [], total_searched: 0, search_time_ms: Date.now() - startTime };
  }

  // Step 2: Group by candidate, count skill matches
  const candidateSkillMap = new Map<string, Set<string>>();
  for (const sm of skillMatches) {
    const existing = candidateSkillMap.get(sm.user_id) || new Set();
    existing.add(sm.skill.toLowerCase());
    candidateSkillMap.set(sm.user_id, existing);
  }

  // Step 3: Get candidate profiles for top skill matchers
  // Sort by # of matching skills descending, take top N*3 for further filtering
  const sortedCandidates = Array.from(candidateSkillMap.entries())
    .map(([userId, skills]) => ({
      userId,
      matchedSkills: skills,
      skillOverlap: skills.size / normalizedJobSkills.length,
    }))
    .sort((a, b) => b.skillOverlap - a.skillOverlap)
    .slice(0, limit * 3);

  const candidateIds = sortedCandidates.map((c) => c.userId);

  const { data: profiles } = await supabase
    .from("users")
    .select("id, name, headline, profile_strength, candidate_rank_score, is_boosted, boost_multiplier")
    .in("id", candidateIds);

  // Step 4: Get ATS scores
  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p])
  );

  // Step 5: Score and rank candidates
  const results: ShortlistCandidate[] = [];

  for (const candidate of sortedCandidates) {
    const profile = profileMap.get(candidate.userId);
    if (!profile) continue;

    const matchedSkillsList = Array.from(candidate.matchedSkills);
    const missingSkills = normalizedJobSkills.filter(
      (s) => !candidate.matchedSkills.has(s)
    );

    // Composite score: skill overlap 50% + profile strength 20% + rank 20% + boost 10%
    const skillScore = candidate.skillOverlap * 100;
    const profileScore = profile.profile_strength || 0;
    const rankScore = profile.candidate_rank_score || 0;
    const boostBonus = profile.is_boosted ? 15 : 0;

    const compositeScore = Math.round(
      skillScore * 0.50 +
      profileScore * 0.20 +
      rankScore * 0.20 +
      boostBonus * 0.10
    );

    results.push({
      user_id: candidate.userId,
      name: profile.name || "Anonymous",
      headline: profile.headline,
      match_score: Math.min(100, compositeScore),
      skill_overlap: matchedSkillsList,
      missing_skills: missingSkills,
      ats_score: null, // Can be populated if needed
      profile_strength: profileScore,
      rank_score: rankScore,
      is_boosted: profile.is_boosted || false,
      total_experience_years: null,
    });
  }

  // Sort by composite score, boosted first
  results.sort((a, b) => {
    if (a.is_boosted && !b.is_boosted) return -1;
    if (!a.is_boosted && b.is_boosted) return 1;
    return b.match_score - a.match_score;
  });

  return {
    job_title: jobTitle,
    candidates: results.slice(0, limit),
    total_searched: candidateSkillMap.size,
    search_time_ms: Date.now() - startTime,
  };
}
