export type ApplicationStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected" | "withdrawn";

export interface Application {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_date: string | null;
  url: string | null;
  salary: string | null;
  location: string | null;
  notes: string | null;
  resume_id: string | null;
  cover_letter_id: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

/** Kanban / list status chips — aligned with Navy + Blue SaaS theme */
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-slate-100 text-foreground ring-1 ring-border",
  applied: "bg-blue-50 text-primary ring-1 ring-primary/15",
  interviewing: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/90",
  offer: "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/90",
  rejected: "bg-red-50 text-red-800 ring-1 ring-red-200/90",
  withdrawn: "bg-slate-100 text-text-muted ring-1 ring-border",
};
