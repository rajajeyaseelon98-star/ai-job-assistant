"use client";

import { useState, useEffect } from "react";
import { Rocket, History } from "lucide-react";
import { AutoApplyForm } from "@/components/auto-apply/AutoApplyForm";
import { AutoApplyProgress } from "@/components/auto-apply/AutoApplyProgress";
import { AutoApplyResults } from "@/components/auto-apply/AutoApplyResults";
import { usePastRuns, useStartAutoApply, useAutoApplyRun } from "@/hooks/queries/use-auto-apply";
import type { AutoApplyRun } from "@/types/autoApply";

export default function AutoApplyPage() {
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isNewRun, setIsNewRun] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const { data: pastRuns = [], refetch: refetchPastRuns } = usePastRuns();
  const startMutation = useStartAutoApply();

  const { data: polledRun } = useAutoApplyRun(activeRunId, {
    refetchInterval: isNewRun ? 3000 : false,
  });

  const currentRun = polledRun ?? null;

  useEffect(() => {
    if (isNewRun && currentRun && !["pending", "processing", "confirmed"].includes(currentRun.status)) {
      setIsNewRun(false);
      refetchPastRuns();
    }
  }, [isNewRun, currentRun, refetchPastRuns]);

  async function handleStart(config: {
    resume_id: string;
    location?: string;
    preferred_roles?: string[];
    min_salary?: number;
    max_results?: number;
  }) {
    setStarting(true);
    setError("");
    try {
      const data = await startMutation.mutateAsync(config);
      setActiveRunId(data.id);
      setIsNewRun(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setStarting(false);
    }
  }

  function handleComplete() {
    refetchPastRuns();
  }

  const showForm = !isNewRun && (!currentRun || currentRun.status === "completed" || currentRun.status === "failed");
  const showProgress = isNewRun || (currentRun && ["pending", "processing", "confirmed"].includes(currentRun.status));
  const showResults = currentRun && currentRun.status === "ready_for_review" && currentRun.results?.length > 0;
  const showCompleted = currentRun && currentRun.status === "completed";

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 py-8 sm:space-y-6">
      <div>
        <h1 className="mb-2 flex items-center gap-3 font-display text-3xl font-bold tracking-tight text-slate-900">
          <Rocket className="h-6 w-6 text-indigo-600" /> AI Auto-Apply
        </h1>
        <p className="mb-8 text-base leading-relaxed text-slate-500">
          Upload your resume — we find matches, score them, and you confirm before we apply. Each job shows{" "}
          <strong className="text-slate-900">Direct apply (our platform)</strong> vs{" "}
          <strong className="text-slate-900">External apply</strong> (partner / job board link) so you always know.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {showForm && <AutoApplyForm onStart={handleStart} loading={starting} />}

      {showProgress && currentRun && (
        <AutoApplyProgress
          status={currentRun.status}
          jobsFound={currentRun.jobs_found || 0}
          jobsMatched={currentRun.jobs_matched || 0}
          error={currentRun.error_message}
        />
      )}

      {(showResults || showCompleted) && currentRun && (
        <AutoApplyResults
          runId={currentRun.id}
          results={currentRun.results || []}
          status={currentRun.status}
          onComplete={handleComplete}
        />
      )}

      {/* Past Runs */}
      {pastRuns.length > 0 && (
        <div className="mt-8 space-y-3 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <h2 className="mb-4 flex items-center gap-2 px-4 pt-4 font-display text-xl font-bold text-slate-900">
            <History className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" /> Past Runs
          </h2>
          <div className="divide-y divide-slate-100">
            {pastRuns.slice(0, 10).map((run) => (
              <button
                key={run.id}
                onClick={() => setActiveRunId(run.id)}
                className="w-full p-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(run.created_at).toLocaleDateString()} &middot; {run.jobs_matched || 0} matches
                  </p>
                  <p className="text-xs text-slate-500">
                    {run.jobs_applied || 0} applied &middot; Status: {run.status}
                  </p>
                </div>
                <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                  run.status === "completed" ? "border-emerald-100 bg-emerald-50 text-emerald-700" :
                  run.status === "failed" ? "border-rose-100 bg-rose-50 text-rose-700" :
                  "border-blue-100 bg-blue-50 text-blue-700"
                }`}>
                  {run.status}
                </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
