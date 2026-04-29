import type { ImprovedResumeContent } from "@/types/analysis";

/** Flatten structured improved resume JSON for job applications and cover letters. */
export function improvedResumeContentToPlainText(content: ImprovedResumeContent): string {
  const blocks: string[] = [];
  const s = content.summary?.trim();
  if (s) blocks.push(`SUMMARY\n${s}`);

  if (content.skills?.length) {
    blocks.push(`SKILLS\n${content.skills.map((x) => String(x).trim()).filter(Boolean).join(", ")}`);
  }

  if (content.experience?.length) {
    const lines: string[] = ["EXPERIENCE"];
    for (const ex of content.experience) {
      const head = [ex.title, ex.company].filter(Boolean).join(" — ");
      if (head) lines.push(head);
      for (const b of ex.bullets ?? []) {
        const t = String(b).trim();
        if (t) lines.push(`• ${t}`);
      }
    }
    blocks.push(lines.join("\n"));
  }

  if (content.projects?.length) {
    const lines: string[] = ["PROJECTS"];
    for (const p of content.projects) {
      const head = p.name?.trim();
      if (head) lines.push(head);
      const desc = p.description?.trim();
      if (desc) lines.push(desc);
      for (const b of p.bullets ?? []) {
        const t = String(b).trim();
        if (t) lines.push(`• ${t}`);
      }
    }
    blocks.push(lines.join("\n"));
  }

  const edu = content.education?.trim();
  if (edu) blocks.push(`EDUCATION\n${edu}`);

  return blocks.join("\n\n").trim();
}
