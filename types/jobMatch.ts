export interface JobMatchResult {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  resume_improvements: string[];
}

export interface JobMatchRecord {
  id: string;
  resume_id: string;
  job_description: string;
  job_title: string | null;
  match_score: number;
  missing_skills: string[] | null;
  analysis: JobMatchResult | null;
  created_at: string;
}
