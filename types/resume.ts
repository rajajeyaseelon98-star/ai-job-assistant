export interface Resume {
  id: string;
  user_id: string;
  file_url: string;
  parsed_text: string | null;
  created_at: string;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  score: number;
  analysis_json: AnalysisResult;
  created_at: string;
}

export interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  suggestions: string[];
}
