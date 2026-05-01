import Link from "next/link";
import { FileText, Target, Mail } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "resume_analysis" | "job_match" | "cover_letter";
  title: string;
  subtitle?: string;
  date: string;
}

interface ActivityListProps {
  items: ActivityItem[];
}

export function ActivityList({ items }: ActivityListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="space-y-3">
          <p className="font-sans text-sm text-text-muted">No activity yet. Here&apos;s how to get started:</p>
          <div className="grid gap-2">
            <Link
              href="/resume-analyzer"
              className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface-muted/50 p-3 text-left transition-colors hover:border-primary/30 hover:bg-surface-muted"
            >
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-text">Analyze your resume</p>
                <p className="text-xs text-text-muted">Get structured feedback in about a minute</p>
              </div>
            </Link>
            <Link
              href="/job-match"
              className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface-muted/50 p-3 text-left transition-colors hover:border-primary/30 hover:bg-surface-muted"
            >
              <Target className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-text">Find matching jobs</p>
                <p className="text-xs text-text-muted">AI matches you with the best opportunities</p>
              </div>
            </Link>
            <Link
              href="/cover-letter"
              className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface-muted/50 p-3 text-left transition-colors hover:border-primary/30 hover:bg-surface-muted"
            >
              <Mail className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-text">Generate a cover letter</p>
                <p className="text-xs text-text-muted">AI-crafted and tailored to the job</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text sm:text-base">{item.title}</p>
              {item.subtitle && (
                <p className="truncate text-xs text-text-muted sm:text-sm">{item.subtitle}</p>
              )}
            </div>
            <span className="shrink-0 font-sans text-sm text-text-muted">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
