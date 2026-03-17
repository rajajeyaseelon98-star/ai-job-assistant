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
  0: "border-gray-200 bg-card",
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
      <div className="rounded-xl border border-gray-200 bg-card p-6 animate-pulse">
        <div className="h-32" />
      </div>
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-card">
      {/* Header with progress */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h3 className="font-semibold text-text">Today&apos;s Action Plan</h3>
          <p className="text-xs text-text-muted">
            {progress.completed}/{progress.total} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500 transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className="text-xs font-medium text-text-muted">{progress.percentage}%</span>
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
              className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                action.completed ? "opacity-60" : ""
              } ${PRIORITY_STYLES[action.priority] || PRIORITY_STYLES[0]}`}
            >
              {/* Checkbox */}
              <button
                onClick={() => !action.completed && handleComplete(action.id)}
                disabled={action.completed || isCompleting}
                className="mt-0.5 shrink-0"
              >
                {isCompleting ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : action.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 hover:text-primary" />
                )}
              </button>

              {/* Icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${action.completed ? "line-through text-text-muted" : "text-text"}`}>
                    {action.title}
                  </p>
                  {priorityLabel.text && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityLabel.color}`}>
                      {priorityLabel.text}
                    </span>
                  )}
                </div>
                {action.description && (
                  <p className="mt-0.5 text-xs text-text-muted line-clamp-1">{action.description}</p>
                )}
              </div>

              {/* Action link */}
              {!action.completed && action.action_url && (
                <Link
                  href={action.action_url}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                >
                  Go <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {progress.percentage === 100 && (
        <div className="border-t border-gray-100 bg-green-50 px-4 py-3 text-center">
          <p className="text-sm font-medium text-green-700">
            🎉 All tasks completed! Your streak grows stronger.
          </p>
        </div>
      )}
    </div>
  );
}
