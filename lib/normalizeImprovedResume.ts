import type { ImprovedResumeContent } from "@/types/analysis";

/** Coerce unknown / messy AI output into the fixed five-section shape. */
export function normalizeImprovedResumeContent(input: unknown): ImprovedResumeContent {
  const o =
    typeof input === "object" && input !== null && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};

  const summary =
    typeof o.summary === "string"
      ? o.summary
      : typeof o.professional_summary === "string"
        ? o.professional_summary
        : "";

  let skills: string[] = [];
  if (Array.isArray(o.skills)) {
    skills = o.skills.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean);
  } else if (typeof o.skills === "string") {
    skills = o.skills
      .split(/[,•·\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const experience: ImprovedResumeContent["experience"] = [];
  const rawExp = o.experience ?? o.work_experience ?? o.employment;
  if (Array.isArray(rawExp)) {
    for (const item of rawExp) {
      if (typeof item !== "object" || item === null) continue;
      const e = item as Record<string, unknown>;
      const title = typeof e.title === "string" ? e.title : typeof e.role === "string" ? e.role : "Role";
      const company = typeof e.company === "string" ? e.company : typeof e.employer === "string" ? e.employer : "Company";
      let bullets: string[] = [];
      if (Array.isArray(e.bullets)) {
        bullets = e.bullets.filter((b): b is string => typeof b === "string");
      } else if (typeof e.description === "string") {
        bullets = e.description.split(/\n/).map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
      }
      experience.push({ title, company, bullets });
    }
  }

  const projects: ImprovedResumeContent["projects"] = [];
  const rawProj = o.projects ?? o.project;
  if (Array.isArray(rawProj)) {
    for (const item of rawProj) {
      if (typeof item !== "object" || item === null) continue;
      const p = item as Record<string, unknown>;
      const name = typeof p.name === "string" ? p.name : typeof p.title === "string" ? p.title : "Project";
      const description = typeof p.description === "string" ? p.description : "";
      let bullets: string[] | undefined;
      if (Array.isArray(p.bullets)) {
        bullets = p.bullets.filter((b): b is string => typeof b === "string");
      }
      projects.push({ name, description, bullets });
    }
  }

  let education = "";
  if (typeof o.education === "string") {
    education = o.education;
  } else if (typeof o.education === "object" && o.education !== null) {
    const ed = o.education as Record<string, unknown>;
    const parts = [ed.degree, ed.school, ed.institution, ed.year]
      .filter((x) => x !== undefined && x !== null)
      .map((x) => String(x));
    education = parts.join(", ");
  }

  return {
    summary: summary.trim(),
    skills,
    experience,
    projects,
    education: education.trim(),
  };
}
