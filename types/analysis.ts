export interface ImproveResumeResponse {
  improved_bullets: string[];
}

export interface InterviewPrepResponse {
  technical_questions: { question: string; answer: string }[];
  behavioral_questions: { question: string; answer: string }[];
}
