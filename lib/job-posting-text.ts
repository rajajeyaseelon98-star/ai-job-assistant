const WORK_TYPE_LABELS: Record<string, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

/** Input for composing a single prompt blob for AI (cover letter, screening, etc.) */
export type JobPostingPromptInput = {
  title: string;
  description: string;
  requirements?: string | null;
  skills_required?: string[] | null;
  location?: string | null;
  work_type?: string | null;
  employment_type?: string | null;
  companyName?: string | null;
};

/**
 * Build one plain-text document describing the posting for LLM prompts.
 */
export function buildJobPostingPromptText(job: JobPostingPromptInput): string {
  const lines: string[] = [];

  if (job.companyName?.trim()) {
    lines.push(`Company: ${job.companyName.trim()}`);
  }
  lines.push(`Role: ${job.title.trim()}`);

  if (job.location?.trim()) {
    lines.push(`Location: ${job.location.trim()}`);
  }

  const wt = job.work_type && WORK_TYPE_LABELS[job.work_type];
  if (wt) lines.push(`Work type: ${wt}`);

  const et = job.employment_type && EMPLOYMENT_TYPE_LABELS[job.employment_type];
  if (et) lines.push(`Employment: ${et}`);

  lines.push("");
  lines.push("## Job description");
  lines.push("");
  lines.push(job.description.trim());

  if (job.requirements?.trim()) {
    lines.push("");
    lines.push("## Requirements");
    lines.push("");
    lines.push(job.requirements.trim());
  }

  const skills = job.skills_required?.filter(Boolean) ?? [];
  if (skills.length > 0) {
    lines.push("");
    lines.push("## Required skills");
    lines.push("");
    lines.push(skills.join(", "));
  }

  return lines.join("\n");
}
