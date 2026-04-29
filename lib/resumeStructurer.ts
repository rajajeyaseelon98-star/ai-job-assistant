import { createClient } from "@/lib/supabase/server";
import { cachedAiGenerateJsonWithGuard } from "@/lib/ai";
import { syncCandidateSkills, syncSkillBadges } from "@/lib/candidateGraph";
import type { StructuredResume } from "@/types/structuredResume";
import { buildStructuredPrompt } from "@/lib/aiPromptFactory";
import { AI_INPUT_BUDGETS, sanitizeResumeForAi } from "@/lib/aiInputSanitizer";

type CompactResumeSeed = {
  summary: string;
  skills: string[];
  experience_highlights: string[];
  project_highlights: string[];
  education: string;
  preferred_roles: string[];
  industries: string[];
};

const STRUCTURE_SEED_PROMPT = buildStructuredPrompt({
  role: "resume compactor",
  task: "Extract compact factual seed data from resume text.",
  schema: `{
  "summary":"",
  "skills":[],
  "experience_highlights":[],
  "project_highlights":[],
  "education":"",
  "preferred_roles":[],
  "industries":[]
}`,
  constraints: [
    "skills max 30 strings",
    "experience_highlights max 10 strings",
    "project_highlights max 8 strings",
    "preferred_roles max 5 strings",
    "industries max 5 strings",
  ],
});

const STRUCTURING_PROMPT = buildStructuredPrompt({
  role: "resume parser",
  task: "Build full structured resume JSON using compact seed first, with raw resume as fallback.",
  schema: `{
  "summary":"",
  "skills":[],
  "experience":[{"title":"","company":"","duration":"","bullets":[]}],
  "projects":[{"name":"","description":"","technologies":[]}],
  "education":[{"degree":"","institution":"","year":""}],
  "total_years_experience":0,
  "preferred_roles":[],
  "industries":[]
}`,
  constraints: [
    "experience ordered by most recent first",
    "total_years_experience is numeric",
    "preferred_roles max 5 strings",
    "industries max 5 strings",
    "No markdown and no extra keys",
  ],
});

/**
 * Get or create a structured resume from parsed_text.
 * Lazy extraction: only calls AI on first access, then caches in DB.
 */
export async function getOrCreateStructuredResume(
  resumeId: string,
  userId: string
): Promise<StructuredResume | null> {
  const supabase = await createClient();

  // Check if already structured
  const { data: resume } = await supabase
    .from("resumes")
    .select("parsed_text, structured_json")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .single();

  if (!resume) return null;

  // Return cached structured data if available
  if (resume.structured_json) {
    return resume.structured_json as unknown as StructuredResume;
  }

  // No parsed_text to structure
  if (!resume.parsed_text) return null;

  // Extract structured data via AI (cached)
  let structured: StructuredResume;
  try {
    const sanitizedResume = sanitizeResumeForAi(resume.parsed_text, AI_INPUT_BUDGETS.resumeStructurerChars);
    const seed = await cachedAiGenerateJsonWithGuard<CompactResumeSeed>({
      systemPrompt: STRUCTURE_SEED_PROMPT,
      userContent: sanitizedResume,
      cacheFeature: "resume_structure_seed",
      featureName: "skill_extraction",
      userId,
      normalize: (input) => {
        const raw = typeof input === "object" && input !== null ? (input as Record<string, unknown>) : {};
        return {
          summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
          skills: Array.isArray(raw.skills) ? raw.skills.map(String).slice(0, 30) : [],
          experience_highlights: Array.isArray(raw.experience_highlights)
            ? raw.experience_highlights.map(String).slice(0, 10)
            : [],
          project_highlights: Array.isArray(raw.project_highlights)
            ? raw.project_highlights.map(String).slice(0, 8)
            : [],
          education: typeof raw.education === "string" ? raw.education.trim() : "",
          preferred_roles: Array.isArray(raw.preferred_roles) ? raw.preferred_roles.map(String).slice(0, 5) : [],
          industries: Array.isArray(raw.industries) ? raw.industries.map(String).slice(0, 5) : [],
        };
      },
      retries: 1,
    });

    structured = await cachedAiGenerateJsonWithGuard<StructuredResume>({
      systemPrompt: STRUCTURING_PROMPT,
      userContent: `Compact seed JSON:\n${JSON.stringify(seed)}\n\nRaw resume fallback:\n${sanitizedResume}`,
      cacheFeature: "skill_extraction",
      featureName: "skill_extraction",
      userId,
      normalize: (input) => input as StructuredResume,
      retries: 1,
    });

    // Validate/normalize
    if (!structured.summary) structured.summary = "";
    if (!Array.isArray(structured.skills)) structured.skills = [];
    if (!Array.isArray(structured.experience)) structured.experience = [];
    if (!Array.isArray(structured.projects)) structured.projects = [];
    if (!Array.isArray(structured.education)) structured.education = [];
    if (typeof structured.total_years_experience !== "number") structured.total_years_experience = 0;
    if (!Array.isArray(structured.preferred_roles)) structured.preferred_roles = [];
    if (!Array.isArray(structured.industries)) structured.industries = [];
  } catch {
    return null;
  }

  // Persist to DB for future reads
  await supabase
    .from("resumes")
    .update({ structured_json: structured as unknown as Record<string, unknown> })
    .eq("id", resumeId)
    .eq("user_id", userId);

  // Auto-sync candidate skills + badges for graph/profile (non-blocking)
  syncCandidateSkills(userId, structured).catch(() => {});
  syncSkillBadges(userId, structured).catch(() => {});

  return structured;
}

/**
 * Extract just the skills array from a structured resume.
 */
export function structuredToSkills(structured: StructuredResume): string[] {
  return structured.skills;
}
