import { cachedAiGenerateJsonWithGuard } from "@/lib/ai";
import { buildStructuredPrompt } from "@/lib/aiPromptFactory";
import { AI_INPUT_BUDGETS, sanitizeResumeForAi } from "@/lib/aiInputSanitizer";
import type { ATSAnalysisResult } from "@/types/resume";

export const ATS_BASE_PROMPT = buildStructuredPrompt({
  role: "ATS resume evaluator",
  task: "Analyze resume quality and return score, gaps, and role suggestions.",
  schema: `{"atsScore":0,"missingSkills":[],"resumeImprovements":[],"recommendedRoles":[],"confidence":0}`,
  constraints: [
    "atsScore must be integer 0..100",
    "confidence must be integer 0..100",
    "missingSkills max 10 strings",
    "resumeImprovements max 10 strings",
    "recommendedRoles max 5 strings",
  ],
});

export const ATS_RECHECK_PROMPT = buildStructuredPrompt({
  role: "ATS resume re-evaluator",
  task: `Re-check improved resume against prior feedback only.
Previous score: {{ATS_SCORE}}
Previous missing skills: {{MISSING_SKILLS}}
Previous improvements: {{RESUME_IMPROVEMENTS}}`,
  schema: `{"atsScore":0,"missingSkills":[],"resumeImprovements":[],"recommendedRoles":[],"confidence":0}`,
  constraints: [
    "Use only prior feedback criteria",
    "If mostly addressed, score should be high and remaining arrays minimal",
    "atsScore must be integer 0..100",
    "confidence must be integer 0..100",
    "missingSkills max 10 strings",
    "resumeImprovements max 10 strings",
    "recommendedRoles max 5 strings",
  ],
});

export function parseAtsModelOutput(raw: string): ATSAnalysisResult {
  let jsonStr = raw.trim();
  const jsonMatch = jsonStr.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();
  const data = JSON.parse(jsonStr) as ATSAnalysisResult;
  data.atsScore = Math.min(100, Math.max(0, Number(data.atsScore) || 0));
  data.missingSkills = Array.isArray(data.missingSkills) ? data.missingSkills.slice(0, 10) : [];
  data.resumeImprovements = Array.isArray(data.resumeImprovements)
    ? data.resumeImprovements.slice(0, 10)
    : [];
  data.recommendedRoles = Array.isArray(data.recommendedRoles) ? data.recommendedRoles.slice(0, 5) : [];
  data.confidence = Math.min(100, Math.max(0, Number(data.confidence) || 0));
  return data;
}

export async function runAtsAnalysisFromText(
  text: string,
  opts?: {
    userId?: string;
    recheckAfterImprovement?: boolean;
    previousAnalysis?: { atsScore?: number; missingSkills?: string[]; resumeImprovements?: string[] };
  }
): Promise<ATSAnalysisResult> {
  const sanitizedResume = sanitizeResumeForAi(text, AI_INPUT_BUDGETS.resumeAnalysisChars);
  let promptToUse = `${ATS_BASE_PROMPT}\n\nINPUT RESUME:\n`;
  if (opts?.recheckAfterImprovement && opts.previousAnalysis) {
    const prevScore = opts.previousAnalysis.atsScore ?? 0;
    const missingStr = (opts.previousAnalysis.missingSkills ?? []).join(", ") || "none";
    const improvementsStr = (opts.previousAnalysis.resumeImprovements ?? []).join("; ") || "none";
    promptToUse =
      ATS_RECHECK_PROMPT.replace("{{ATS_SCORE}}", String(prevScore))
        .replace("{{MISSING_SKILLS}}", missingStr)
        .replace("{{RESUME_IMPROVEMENTS}}", improvementsStr) + "\n\nINPUT IMPROVED RESUME:\n";
  }

  return cachedAiGenerateJsonWithGuard({
    systemPrompt: promptToUse,
    userContent: sanitizedResume,
    cacheFeature: "resume_analysis",
    featureName: "resume_analysis",
    userId: opts?.userId,
    normalize: (input) => parseAtsModelOutput(JSON.stringify(input)),
    retries: 1,
  });
}
