export interface Resume {
  id: string;
  user_id: string;
  file_url: string;
  parsed_text: string | null;
  created_at: string;
}

/** ATS analysis response from Gemini (JSON-only prompt). */
export interface ATSAnalysisResult {
  atsScore: number;
  missingSkills: string[];
  resumeImprovements: string[];
  recommendedRoles: string[];
  confidence: number;
}
