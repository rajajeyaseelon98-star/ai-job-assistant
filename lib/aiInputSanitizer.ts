const SECTION_HEADINGS: Array<{ key: string; pattern: RegExp }> = [
  { key: "summary", pattern: /^(summary|profile|objective)\b/i },
  { key: "skills", pattern: /^(skills|technical skills|core skills|competencies)\b/i },
  { key: "experience", pattern: /^(experience|work experience|employment|professional experience)\b/i },
  { key: "projects", pattern: /^(projects|project experience)\b/i },
  { key: "education", pattern: /^(education|academic|qualification)\b/i },
  { key: "other", pattern: /.*/ },
];

function normalizeForAi(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function truncateSafe(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const sliced = text.slice(0, maxChars);
  const lastSentence = Math.max(sliced.lastIndexOf("\n"), sliced.lastIndexOf(". "));
  if (lastSentence > Math.floor(maxChars * 0.75)) return sliced.slice(0, lastSentence + 1).trim();
  return sliced.trim();
}

export function sanitizeTextForAi(text: string, maxChars: number): string {
  return truncateSafe(normalizeForAi(text), maxChars);
}

export function sanitizeResumeForAi(text: string, maxChars: number): string {
  const normalized = normalizeForAi(text);
  if (normalized.length <= maxChars) return normalized;

  const sections: Record<string, string[]> = {
    summary: [],
    skills: [],
    experience: [],
    projects: [],
    education: [],
    other: [],
  };

  let current: keyof typeof sections = "other";
  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = SECTION_HEADINGS.find((h) => h.pattern.test(line));
    if (heading) current = heading.key as keyof typeof sections;
    sections[current].push(line);
  }

  const prioritized = [
    ...sections.summary,
    ...sections.skills,
    ...sections.experience,
    ...sections.projects,
    ...sections.education,
    ...sections.other,
  ].join("\n");

  return truncateSafe(prioritized || normalized, maxChars);
}

export const AI_INPUT_BUDGETS = {
  resumeAnalysisChars: 12000,
  resumeImproveChars: 9000,
  resumeStructurerChars: 9000,
  jobMatchResumeChars: 7000,
  jobMatchJobDescriptionChars: 5000,
} as const;

