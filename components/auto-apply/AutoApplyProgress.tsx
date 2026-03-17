"use client";

import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface AutoApplyProgressProps {
  status: string;
  jobsFound: number;
  jobsMatched: number;
  error?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Initializing...",
  processing: "Finding and matching jobs...",
  ready_for_review: "Jobs found! Review matches below.",
  confirmed: "Applying to selected jobs...",
  completed: "Auto-apply complete!",
  failed: "Something went wrong.",
};

export function AutoApplyProgress({ status, jobsFound, jobsMatched, error }: AutoApplyProgressProps) {
  const isActive = status === "pending" || status === "processing" || status === "confirmed";
  const isDone = status === "completed" || status === "ready_for_review";
  const isFailed = status === "failed";

  return (
    <div className={`rounded-xl border p-4 ${
      isFailed ? "border-red-200 bg-red-50" : isDone ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"
    }`}>
      <div className="flex items-center gap-3">
        {isActive && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
        {isDone && <CheckCircle className="h-5 w-5 text-green-600" />}
        {isFailed && <AlertCircle className="h-5 w-5 text-red-600" />}
        <div>
          <p className={`text-sm font-medium ${
            isFailed ? "text-red-800" : isDone ? "text-green-800" : "text-blue-800"
          }`}>
            {STATUS_LABELS[status] || status}
          </p>
          {(jobsFound > 0 || jobsMatched > 0) && (
            <p className="mt-0.5 text-xs text-text-muted">
              {jobsFound} jobs found &middot; {jobsMatched} matched
            </p>
          )}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
