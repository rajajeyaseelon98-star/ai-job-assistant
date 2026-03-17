import { createClient } from "@/lib/supabase/server";
import type { StructuredResume } from "@/types/structuredResume";

/**
 * Candidate Graph — indexes user skills globally for recruiter search.
 * Auto-populates from structured resume data.
 */

/** Normalize skill name for deduplication */
function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\+\#\.]/g, "")
    .replace(/\s+/g, " ");
}

/** Estimate proficiency from structured resume */
function estimateProficiency(
  skill: string,
  resume: StructuredResume
): { level: "beginner" | "intermediate" | "expert"; years: number } {
  const skillLower = skill.toLowerCase();
  let mentionCount = 0;
  let yearsEstimate = 0;

  // Count mentions in experience bullets
  for (const exp of resume.experience) {
    const expText = [exp.title, ...exp.bullets].join(" ").toLowerCase();
    if (expText.includes(skillLower)) {
      mentionCount++;
      // Rough year estimate from duration
      const durationMatch = exp.duration.match(/(\d+)\s*(?:year|yr)/i);
      if (durationMatch) yearsEstimate += parseInt(durationMatch[1]);
    }
  }

  // Count in projects
  for (const proj of resume.projects) {
    const projText = [proj.name, proj.description, ...proj.technologies].join(" ").toLowerCase();
    if (projText.includes(skillLower)) mentionCount++;
  }

  // Determine level
  if (mentionCount >= 3 || yearsEstimate >= 4) {
    return { level: "expert", years: Math.max(yearsEstimate, 4) };
  } else if (mentionCount >= 1 || yearsEstimate >= 2) {
    return { level: "intermediate", years: Math.max(yearsEstimate, 2) };
  } else {
    return { level: "beginner", years: Math.max(yearsEstimate, 0.5) };
  }
}

/**
 * Sync user's skills to candidate_skills table from structured resume.
 * Upserts so it's idempotent.
 */
export async function syncCandidateSkills(
  userId: string,
  structured: StructuredResume
): Promise<void> {
  const supabase = await createClient();

  const records = structured.skills.map((skill) => {
    const { level, years } = estimateProficiency(skill, structured);
    return {
      user_id: userId,
      skill,
      skill_normalized: normalizeSkill(skill),
      years_experience: years,
      proficiency: level,
      updated_at: new Date().toISOString(),
    };
  });

  if (records.length === 0) return;

  // Batch upsert (Supabase supports this)
  await supabase
    .from("candidate_skills")
    .upsert(records, { onConflict: "user_id,skill_normalized" });
}

/**
 * Sync skill badges for public profile display.
 */
export async function syncSkillBadges(
  userId: string,
  structured: StructuredResume
): Promise<void> {
  const supabase = await createClient();

  const badges = structured.skills.slice(0, 20).map((skill) => {
    const { level, years } = estimateProficiency(skill, structured);
    return {
      user_id: userId,
      skill_name: skill,
      level,
      years_experience: years,
      verified: false,
    };
  });

  if (badges.length === 0) return;

  await supabase
    .from("skill_badges")
    .upsert(badges, { onConflict: "user_id,skill_name" });
}

/**
 * Find similar candidates based on skill overlap.
 * Used by recruiters to discover related talent.
 */
export async function findSimilarCandidates(
  userId: string,
  limit = 10
): Promise<Array<{
  user_id: string;
  name: string | null;
  headline: string | null;
  common_skills: string[];
  similarity_score: number;
}>> {
  const supabase = await createClient();

  // Get the target user's skills
  const { data: targetSkills } = await supabase
    .from("candidate_skills")
    .select("skill_normalized")
    .eq("user_id", userId);

  if (!targetSkills || targetSkills.length === 0) return [];

  const skillSet = targetSkills.map((s) => s.skill_normalized);

  // Find users who share skills (excluding the target user)
  const { data: matches } = await supabase
    .from("candidate_skills")
    .select("user_id, skill_normalized, skill")
    .in("skill_normalized", skillSet)
    .neq("user_id", userId);

  if (!matches || matches.length === 0) return [];

  // Group by user_id and count common skills
  const userSkillMap = new Map<string, string[]>();
  for (const match of matches) {
    const existing = userSkillMap.get(match.user_id) || [];
    existing.push(match.skill);
    userSkillMap.set(match.user_id, existing);
  }

  // Calculate similarity and sort
  const candidates = Array.from(userSkillMap.entries())
    .map(([uid, skills]) => ({
      user_id: uid,
      common_skills: skills,
      // Jaccard similarity: intersection / union
      similarity_score: Math.round(
        (skills.length / (skillSet.length + skills.length - skills.length)) * 100
      ),
    }))
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);

  // Fetch user names
  const userIds = candidates.map((c) => c.user_id);
  const { data: users } = await supabase
    .from("users")
    .select("id, name, headline")
    .in("id", userIds);

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  return candidates.map((c) => ({
    ...c,
    name: userMap.get(c.user_id)?.name || null,
    headline: userMap.get(c.user_id)?.headline || null,
  }));
}
