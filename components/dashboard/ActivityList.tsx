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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <p className="font-sans text-sm text-slate-500">No activity yet. Here&apos;s how to get started:</p>
          <div className="grid gap-2">
            <Link
              href="/resume-analyzer"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              <FileText className="h-5 w-5 shrink-0 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Analyze your resume</p>
                <p className="text-xs text-slate-500">Get your ATS score in 30 seconds</p>
              </div>
            </Link>
            <Link
              href="/job-match"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              <Target className="h-5 w-5 shrink-0 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Find matching jobs</p>
                <p className="text-xs text-slate-500">AI matches you with the best opportunities</p>
              </div>
            </Link>
            <Link
              href="/cover-letter"
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              <Mail className="h-5 w-5 shrink-0 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Generate a cover letter</p>
                <p className="text-xs text-slate-500">AI-crafted and tailored to the job</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-1 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 sm:text-base">{item.title}</p>
              {item.subtitle && (
                <p className="truncate text-xs text-slate-500 sm:text-sm">{item.subtitle}</p>
              )}
            </div>
            <span className="shrink-0 font-sans text-sm text-slate-400">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
