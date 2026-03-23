"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Rocket,
  FileText,
  Target,
  Mic2,
  BarChart3,
  Wand2,
  IndianRupee,
  Award,
  MessageSquare,
  Users,
  ArrowRight,
} from "lucide-react";

interface DailyAction {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  priority: number;
  completed: boolean;
  action_url?: string;
}

interface DailyProgress {
  total: number;
  completed: number;
  percentage: number;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  apply_jobs: Rocket,
  improve_resume: FileText,
  check_matches: Target,
  prep_interview: Mic2,
  review_analytics: BarChart3,
  tailor_resume: Wand2,
  explore_salary: IndianRupee,
  boost_profile: Award,
  respond_recruiter: MessageSquare,
  check_competition: Users,
};

const PRIORITY_STYLES: Record<number, string> = {
  0: "border-slate-100 bg-white",
  1: "border-blue-200 bg-blue-50/50",
  2: "border-orange-200 bg-orange-50/50",
};

const PRIORITY_LABELS: Record<number, { text: string; color: string }> = {
  0: { text: "", color: "" },
  1: { text: "Important", color: "text-blue-600 bg-blue-100" },
  2: { text: "Urgent", color: "text-orange-600 bg-orange-100" },
};

export function DailyActions() {
  const [actions, setActions] = useState<DailyAction[]>([]);
  const [progress, setProgress] = useState<DailyProgress>({ total: 0, completed: 0, percentage: 0 });
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/daily-actions")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setActions(d.actions || []);
          setProgress(d.progress || { total: 0, completed: 0, percentage: 0 });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleComplete(actionId: string) {
    setCompleting(actionId);
    try {
      const res = await fetch("/api/daily-actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: actionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setActions((prev) =>
          prev.map((a) => (a.id === actionId ? { ...a, completed: true } : a))
        );
        if (data.progress) setProgress(data.progress);
      }
    } catch {
      // ignore
    }
    setCompleting(null);
  }

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-32" />
      </div>
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header with progress */}
      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 md:px-6 sm:py-4">
        <div>
          <h3 className="font-display text-sm font-semibold text-slate-900 sm:text-base md:text-lg">Today&apos;s Action Plan</h3>
          <p className="font-sans text-xs text-slate-500 sm:text-sm">
            {progress.completed}/{progress.total} completed
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-2 w-full rounded-full bg-slate-200 sm:w-24 md:w-28">
            <div
              className="h-2 rounded-full bg-indigo-600 transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-slate-500 sm:text-sm">{progress.percentage}%</span>
        </div>
      </div>

      {/* Action items */}
      <div className="divide-y divide-gray-50">
        {actions.map((action) => {
          const Icon = ACTION_ICONS[action.action_type] || Target;
          const priorityLabel = PRIORITY_LABELS[action.priority];
          const isCompleting = completing === action.id;

          return (
            <div
              key={action.id}
              className={`flex items-start gap-2 sm:gap-3 md:gap-4 px-4 sm:px-5 md:px-6 py-3 sm:py-4 transition-colors ${
                action.completed ? "opacity-60" : ""
              } ${PRIORITY_STYLES[action.priority] || PRIORITY_STYLES[0]}`}
            >
              {/* Checkbox */}
              <button
                onClick={() => !action.completed && handleComplete(action.id)}
                disabled={action.completed || isCompleting}
                className="mt-0.5 shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center active:opacity-70 active:bg-gray-100 rounded-md transition-colors"
              >
                {isCompleting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600 sm:h-5 sm:w-5" />
                ) : action.completed ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 hover:text-primary" />
                )}
              </button>

              {/* Icon - hidden on smallest screens */}
              <div className="hidden sm:flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <p className={`text-sm sm:text-base font-medium truncate ${action.completed ? "line-through text-text-muted" : "text-text"}`}>
                    {action.title}
                  </p>
                  {priorityLabel.text && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-medium shrink-0 ${priorityLabel.color}`}>
                      {priorityLabel.text}
                    </span>
                  )}
                </div>
                {action.description && (
                  <p className="mt-0.5 text-xs sm:text-sm text-text-muted line-clamp-1 sm:line-clamp-2">{action.description}</p>
                )}
              </div>

              {/* Action link */}
              {!action.completed && action.action_url && (
                <Link
                  href={action.action_url}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-primary hover:bg-primary/20 active:bg-primary/30 min-h-[44px] min-w-[44px] justify-center transition-colors"
                >
                  <span className="hidden sm:inline">Go</span> <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {progress.percentage === 100 && (
        <div className="rounded-b-xl border-t border-slate-100 bg-emerald-50 px-4 py-3 text-center sm:px-5 md:px-6 sm:py-4">
          <p className="text-sm font-medium text-emerald-800 sm:text-base">
            All tasks completed! Your streak grows stronger.
          </p>
        </div>
      )}
    </div>
  );
}
