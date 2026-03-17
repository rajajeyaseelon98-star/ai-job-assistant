import { createClient } from "@/lib/supabase/server";
import { sendRecruiterPush } from "@/lib/recruiterPush";

/**
 * Auto-push top matching candidates to a recruiter for a specific job.
 * Called when a recruiter posts or activates a job.
 */
export async function autoPushCandidatesForJob(
  recruiterId: string,
  jobId: string,
  jobTitle: string,
  skillsRequired: string[],
  limit = 8
): Promise<{ pushed: number; candidates: string[] }> {
  const supabase = await createClient();

  // Find candidates who match the required skills
  const normalizedSkills = skillsRequired.map((s) => s.toLowerCase().trim());
  if (normalizedSkills.length === 0) return { pushed: 0, candidates: [] };

  // Get candidates with matching skills (ordered by rank score)
  const { data: candidateSkills } = await supabase
    .from("candidate_skills")
    .select("user_id, skill")
    .in("skill_normalized", normalizedSkills)
    .limit(500);

  if (!candidateSkills || candidateSkills.length === 0) {
    return { pushed: 0, candidates: [] };
  }

  // Count skill matches per candidate
  const candidateMatchCounts = new Map<string, number>();
  for (const cs of candidateSkills) {
    candidateMatchCounts.set(
      cs.user_id,
      (candidateMatchCounts.get(cs.user_id) || 0) + 1
    );
  }

  // Sort by match count, get top candidates
  const ranked = [...candidateMatchCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit * 2); // Fetch extra in case some were already pushed

  // Filter out candidates already pushed for this job
  const { data: existingPushes } = await supabase
    .from("recruiter_pushes")
    .select("candidate_id")
    .eq("recruiter_id", recruiterId)
    .eq("job_id", jobId);

  const alreadyPushed = new Set((existingPushes || []).map((p) => p.candidate_id));

  // Also filter out the recruiter themselves
  const candidates = ranked
    .filter(([uid]) => uid !== recruiterId && !alreadyPushed.has(uid))
    .slice(0, limit);

  // Get candidate names for personalized messages
  const candidateIds = candidates.map(([uid]) => uid);
  const { data: users } = await supabase
    .from("users")
    .select("id, name, profile_visible")
    .in("id", candidateIds);

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  let pushed = 0;
  const pushedCandidates: string[] = [];

  for (const [candidateId, matchCount] of candidates) {
    const user = userMap.get(candidateId);
    if (!user) continue;

    const skillsMatched = matchCount;
    const totalSkills = normalizedSkills.length;

    const result = await sendRecruiterPush(
      recruiterId,
      candidateId,
      "job_invite",
      `New opportunity: ${jobTitle}`,
      `A recruiter found you as a ${Math.round((skillsMatched / totalSkills) * 100)}% skill match for "${jobTitle}". Check it out!`,
      jobId
    );

    if (result.success) {
      pushed++;
      pushedCandidates.push(candidateId);
    }
  }

  return { pushed, candidates: pushedCandidates };
}

/**
 * Auto-push new matching candidates to recruiters daily (cron).
 * Scans active jobs and finds newly qualified candidates.
 */
export async function runDailyRecruiterAutoPush(): Promise<{
  jobs_processed: number;
  total_pushed: number;
}> {
  const supabase = await createClient();

  // Get active job postings
  const { data: activeJobs } = await supabase
    .from("job_postings")
    .select("id, recruiter_id, title, skills_required")
    .eq("status", "active")
    .limit(50);

  let jobsProcessed = 0;
  let totalPushed = 0;

  for (const job of activeJobs || []) {
    const skills = (job.skills_required || []) as string[];
    if (skills.length === 0) continue;

    const result = await autoPushCandidatesForJob(
      job.recruiter_id,
      job.id,
      job.title,
      skills,
      5 // Max 5 candidates per job per day
    );

    jobsProcessed++;
    totalPushed += result.pushed;
  }

  return { jobs_processed: jobsProcessed, total_pushed: totalPushed };
}
