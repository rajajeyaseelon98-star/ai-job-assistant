/** AI-rewritten resume in structured form (for full Resume Fixer flow). */
export interface ImprovedResumeContent {
  summary: string;
  skills: string[];
  experience: Array<{ title: string; company: string; bullets: string[] }>;
  projects: Array<{ name: string; description: string; bullets?: string[] }>;
  education: string;
}

export interface InterviewPrepResponse {
  technical_questions: { question: string; answer: string }[];
  behavioral_questions: { question: string; answer: string }[];
  coding_questions?: { question: string; answer: string }[];
}
