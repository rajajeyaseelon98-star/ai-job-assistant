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
      <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
        <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-text">Recent Activity</h3>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-text-muted">No activity yet. Here&apos;s how to get started:</p>
          <div className="grid gap-2">
            <Link
              href="/resume-analyzer"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-text">Analyze your resume</p>
                <p className="text-xs text-text-muted">Get your ATS score in 30 seconds</p>
              </div>
            </Link>
            <Link
              href="/job-match"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Target className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-text">Find matching jobs</p>
                <p className="text-xs text-text-muted">AI matches you with the best opportunities</p>
              </div>
            </Link>
            <Link
              href="/cover-letter"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Mail className="h-5 w-5 text-green-500 shrink-0" />
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
    <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
      <h3 className="text-lg sm:text-xl md:text-2xl font-medium text-text">Recent Activity</h3>
      <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 md:space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 md:gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-medium text-text truncate">{item.title}</p>
              {item.subtitle && (
                <p className="text-xs sm:text-sm text-text-muted truncate">{item.subtitle}</p>
              )}
            </div>
            <span className="text-xs sm:text-sm text-text-muted shrink-0">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
