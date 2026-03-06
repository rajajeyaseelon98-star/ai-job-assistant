export interface JobMatchResult {
  match_score: number;
  missing_skills: string[];
  recommended_keywords: string[];
}

export interface JobMatchRecord {
  id: string;
  resume_id: string;
  job_description: string;
  match_score: number;
  missing_skills: string[] | null;
  created_at: string;
}
