export interface Company {
  id: string;
  recruiter_id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  culture: string | null;
  benefits: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkType = "onsite" | "remote" | "hybrid";
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
export type JobStatus = "draft" | "active" | "paused" | "closed";

export interface JobPosting {
  id: string;
  recruiter_id: string;
  company_id: string | null;
  title: string;
  description: string;
  requirements: string | null;
  skills_required: string[];
  experience_min: number;
  experience_max: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  location: string | null;
  work_type: WorkType;
  employment_type: EmploymentType;
  status: JobStatus;
  application_count: number;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export type ApplicationStage =
  | "applied"
  | "shortlisted"
  | "interview_scheduled"
  | "interviewed"
  | "offer_sent"
  | "hired"
  | "rejected";

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  interviewed: "Interviewed",
  offer_sent: "Offer Sent",
  hired: "Hired",
  rejected: "Rejected",
};

export const STAGE_COLORS: Record<ApplicationStage, string> = {
  applied: "bg-gray-100 text-gray-700",
  shortlisted: "bg-blue-100 text-blue-700",
  interview_scheduled: "bg-yellow-100 text-yellow-700",
  interviewed: "bg-purple-100 text-purple-700",
  offer_sent: "bg-green-100 text-green-700",
  hired: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  recruiter_id: string;
  resume_id: string | null;
  resume_text: string | null;
  cover_letter: string | null;
  stage: ApplicationStage;
  match_score: number | null;
  ai_summary: string | null;
  ai_screening: AIScreening | null;
  recruiter_notes: string | null;
  recruiter_rating: number | null;
  interview_date: string | null;
  interview_notes: string | null;
  created_at: string;
  updated_at: string;
  candidate?: { id: string; email: string; name: string | null };
  job?: JobPosting;
}

export interface AIScreening {
  experience_years: number;
  key_skills: string[];
  strengths: string[];
  weaknesses: string[];
  ats_score: number;
  recommendation: "strong_yes" | "yes" | "maybe" | "no";
  summary: string;
  confidence: number;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  job_id: string | null;
  subject: string | null;
  content: string;
  is_read: boolean;
  /** Set when the recipient marks the message read (outgoing: peer has read). */
  read_at?: string | null;
  template_name: string | null;
  created_at: string;
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  /** Present on API responses when `attachment_path` is set (signed URL). */
  attachment_url?: string | null;
}

export interface MessageTemplate {
  id: string;
  recruiter_id: string;
  name: string;
  subject: string | null;
  content: string;
  template_type: "general" | "interview_invite" | "rejection" | "offer" | "follow_up";
  created_at: string;
}

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
};
