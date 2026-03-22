export interface AutoApplyConfig {
  resume_id: string;
  location?: string;
  preferred_roles?: string[];
  min_salary?: number;
  max_results?: number;
}

export interface InterviewProbability {
  score: number;
  level: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  boost_tips: string[];
}

export interface AutoApplyJobResult {
  job_id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  url: string;
  source: string;
  /** platform = apply on our site; external = partner listing (e.g. Adzuna) */
  apply_channel?: "platform" | "external";
  match_score: number;
  match_reason: string;
  cover_letter?: string;
  tailored_summary?: string;
  interview_probability?: InterviewProbability;
  selected: boolean;
  applied: boolean;
}

export interface SmartApplyRules {
  min_match_score: number;
  min_salary?: number;
  max_salary?: number;
  preferred_roles: string[];
  preferred_locations: string[];
  include_remote: boolean;
  max_applications_per_day: number;
  max_applications_per_week: number;
}

export interface SmartApplyRule {
  id: string;
  user_id: string;
  resume_id: string;
  enabled: boolean;
  rules: SmartApplyRules;
  last_run_at: string | null;
  next_run_at: string | null;
  total_runs: number;
  total_applied: number;
  created_at: string;
  updated_at: string;
}

export interface AutoApplyRun {
  id: string;
  user_id: string;
  resume_id: string | null;
  status: "pending" | "processing" | "ready_for_review" | "confirmed" | "completed" | "failed";
  config: AutoApplyConfig;
  results: AutoApplyJobResult[];
  jobs_found: number;
  jobs_matched: number;
  jobs_applied: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
