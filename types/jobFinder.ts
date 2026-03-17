export interface ExtractedSkills {
  technical: string[];
  soft: string[];
  tools: string[];
  experience_level: string;
  preferred_roles: string[];
  industries: string[];
}

export interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  url: string;
  source: string;
  match_reason: string;
  created_at?: string;
}

export interface JobSearchRecord {
  id: string;
  user_id: string;
  resume_text: string | null;
  extracted_skills: ExtractedSkills | null;
  job_results: JobResult[];
  search_query: string | null;
  location: string | null;
  created_at: string;
}
