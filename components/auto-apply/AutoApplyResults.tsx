"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { JobMatchCard } from "./JobMatchCard";
import type { AutoApplyJobResult } from "@/types/autoApply";
import {
  usePatchAutoApplySelections,
  useConfirmAutoApply,
} from "@/hooks/queries/use-auto-apply";
import { formatApiFetchThrownError } from "@/lib/api-error";
import { AutoApplyRunReceipt } from "@/components/auto-apply/AutoApplyRunReceipt";
import { InlineRetryCard } from "@/components/ui/InlineRetryCard";

interface AutoApplyResultsProps {
  runId: string;
  results: AutoApplyJobResult[];
  status: string;
  onComplete: () => void;
}

export function AutoApplyResults({ runId, results, status, onComplete }: AutoApplyResultsProps) {
  const [jobs, setJobs] = useState<AutoApplyJobResult[]>(results);
  const [actionError, setActionError] = useState("");
  const [appliedCount, setAppliedCount] = useState<number | null>(null);
  const [failedItems, setFailedItems] = useState<Array<{ jobId: string; title: string; reason: string }>>([]);
  const [confirmApplyActive, setConfirmApplyActive] = useState(false);
  const patchMut = usePatchAutoApplySelections();
  const confirmMut = useConfirmAutoApply();
  const saving = patchMut.isPending && !confirmApplyActive;
  const confirming = patchMut.isPending || confirmMut.isPending;
  const [confirmed, setConfirmed] = useState(status === "completed");

  const selectedCount = jobs.filter((j) => j.selected && !j.applied).length;

  function handleToggle(jobId: string) {
    setJobs((prev) =>
      prev.map((j) => (j.job_id === jobId ? { ...j, selected: !j.selected } : j))
    );
  }

  function selectAll() {
    setJobs((prev) => prev.map((j) => (j.applied ? j : { ...j, selected: true })));
  }

  function deselectAll() {
    setJobs((prev) => prev.map((j) => ({ ...j, selected: false })));
  }

  async function handleSaveSelections() {
    setConfirmApplyActive(false);
    setActionError("");
    try {
      await patchMut.mutateAsync({
        runId,
        selected_job_ids: jobs.filter((j) => j.selected).map((j) => j.job_id),
      });
    } catch (e) {
      setActionError(formatApiFetchThrownError(e));
    }
  }

  async function handleConfirmApply() {
    if (selectedCount === 0) return;
    setConfirmApplyActive(true);
    setActionError("");
    try {
      await patchMut.mutateAsync({
        runId,
        selected_job_ids: jobs.filter((j) => j.selected).map((j) => j.job_id),
      });
      const data = await confirmMut.mutateAsync(runId);
      setJobs((prev) => prev.map((j) => (j.selected ? { ...j, applied: true } : j)));
      setAppliedCount(data.applied_count);
      setFailedItems(data.failed_items ?? []);
      setConfirmed(true);
      onComplete();
    } catch (e) {
      setActionError(formatApiFetchThrownError(e));
    } finally {
      setConfirmApplyActive(false);
    }
  }

  function handleRetryFailedSubset() {
    if (failedItems.length === 0) return;
    const failedSet = new Set(failedItems.map((item) => item.jobId));
    setJobs((prev) =>
      prev.map((job) => ({
        ...job,
        selected: failedSet.has(job.job_id),
        applied: failedSet.has(job.job_id) ? false : job.applied,
      }))
    );
    setConfirmed(false);
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-8 text-center">
        <p className="text-sm text-text-muted">No matching jobs found. Try adjusting your preferences.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-base sm:text-lg font-semibold text-text">
          {jobs.length} Matched Jobs
        </h2>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs text-primary hover:underline active:opacity-70 min-h-[44px] sm:min-h-0">Select all</button>
          <span className="text-xs text-text-muted leading-[44px] sm:leading-normal">|</span>
          <button onClick={deselectAll} className="text-xs text-text-muted hover:underline active:opacity-70 min-h-[44px] sm:min-h-0">Deselect all</button>
        </div>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <JobMatchCard key={job.job_id} job={job} onToggleSelect={handleToggle} />
        ))}
      </div>

      {!confirmed && (
        <div className="sticky bottom-6 z-20 mx-auto mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-xl shadow-slate-200/50 backdrop-blur-md sm:flex-row">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-700">
              {selectedCount} job{selectedCount !== 1 ? "s" : ""} selected
            </p>
            <p className="text-xs text-slate-500">
              Applications will be tracked in your Applications page
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
            <div className="flex w-full gap-2 sm:w-auto">
              <button
                onClick={handleSaveSelections}
                disabled={saving || confirming}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50 sm:flex-none"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save
              </button>
              <button
                onClick={handleConfirmApply}
                disabled={confirming || selectedCount === 0}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 sm:flex-none"
              >
                {confirmApplyActive && confirming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Apply to {selectedCount} Job{selectedCount !== 1 ? "s" : ""}
              </button>
            </div>
            {actionError ? (
              <div className="w-full sm:max-w-md">
                <InlineRetryCard
                  message={actionError}
                  onRetry={() => void handleSaveSelections()}
                  retryLabel="Retry save"
                  alternateHref="/applications"
                  alternateLabel="View applications"
                />
              </div>
            ) : null}
          </div>
        </div>
      )}

      {confirmed && (
        <div className="space-y-3">
          <div className="flex items-start sm:items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 sm:p-4">
            <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
            <p className="text-xs sm:text-sm font-medium text-green-800">
              {appliedCount != null
                ? `Successfully applied to ${appliedCount} job${appliedCount !== 1 ? "s" : ""}. `
                : null}
              Check your Applications page for tracking.
            </p>
          </div>
          <AutoApplyRunReceipt
            appliedCount={appliedCount ?? 0}
            skippedCount={Math.max(0, jobs.filter((job) => !job.selected).length)}
            failedCount={failedItems.length}
          />
          {failedItems.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800">
                {failedItems.length} job application{failedItems.length === 1 ? "" : "s"} failed.
              </p>
              <button
                type="button"
                onClick={handleRetryFailedSubset}
                className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
              >
                Retry failed subset
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
