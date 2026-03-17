import type { StructuredResume } from "@/types/structuredResume";

interface JobCandidate {
  title: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
}

/**
 * Pre-filter scoring without AI.
 * Returns 0-100 based on: skill_overlap * 0.6 + experience * 0.3 + location * 0.1
 */
export function preFilterScore(
  resume: StructuredResume,
  job: JobCandidate,
  preferredLocation?: string
): number {
  // Skill overlap (0-100) * 0.6
  // Use word boundary matching to avoid false positives like "react" in "reaction"
  const resumeSkills = new Set(resume.skills.map((s) => s.toLowerCase()));
  const jobText = (job.title + " " + job.description).toLowerCase();
  let skillMatches = 0;
  for (const skill of resumeSkills) {
    try {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`\\b${escaped}\\b`, "i").test(jobText)) skillMatches++;
    } catch {
      // Fallback for regex edge cases
      if (jobText.includes(skill)) skillMatches++;
    }
  }
  const skillScore = resumeSkills.size > 0
    ? Math.min(100, (skillMatches / Math.min(resumeSkills.size, 10)) * 100)
    : 0;

  // Experience match (0-100) * 0.3
  let experienceScore = 50; // default mid
  const jobLower = jobText;
  if (jobLower.includes("senior") || jobLower.includes("lead") || jobLower.includes("principal")) {
    experienceScore = resume.total_years_experience >= 5 ? 90 : resume.total_years_experience >= 3 ? 60 : 20;
  } else if (jobLower.includes("junior") || jobLower.includes("entry") || jobLower.includes("intern")) {
    experienceScore = resume.total_years_experience <= 3 ? 90 : 50;
  } else if (jobLower.includes("mid") || jobLower.includes("intermediate")) {
    experienceScore = resume.total_years_experience >= 2 && resume.total_years_experience <= 6 ? 90 : 50;
  }

  // Role title match bonus
  const roleMatch = resume.preferred_roles.some((r) =>
    jobLower.includes(r.toLowerCase())
  );
  if (roleMatch) experienceScore = Math.min(100, experienceScore + 20);

  // Location match (0-100) * 0.1
  let locationScore = 50;
  const jobLocation = job.location.toLowerCase();
  if (jobLocation.includes("remote")) {
    locationScore = 90;
  } else if (preferredLocation) {
    const prefLoc = preferredLocation.toLowerCase();
    locationScore = jobLocation.includes(prefLoc) ? 95 : 30;
  }

  const total = Math.round(
    skillScore * 0.6 + experienceScore * 0.3 + locationScore * 0.1
  );

  return Math.min(100, Math.max(0, total));
}

/**
 * Sort and filter jobs by pre-filter score, returning top N.
 */
export function rankJobs<T extends JobCandidate>(
  resume: StructuredResume,
  jobs: T[],
  topN: number,
  preferredLocation?: string
): (T & { preFilterScore: number })[] {
  const scored = jobs.map((job) => ({
    ...job,
    preFilterScore: preFilterScore(resume, job, preferredLocation),
  }));

  scored.sort((a, b) => b.preFilterScore - a.preFilterScore);

  return scored.slice(0, topN);
}
