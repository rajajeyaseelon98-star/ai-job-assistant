"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle } from "lucide-react";
import { JobMatchCard } from "./JobMatchCard";
import type { AutoApplyJobResult } from "@/types/autoApply";

interface AutoApplyResultsProps {
  runId: string;
  results: AutoApplyJobResult[];
  status: string;
  onComplete: () => void;
}

export function AutoApplyResults({ runId, results, status, onComplete }: AutoApplyResultsProps) {
  const [jobs, setJobs] = useState<AutoApplyJobResult[]>(results);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
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
    setSaving(true);
    try {
      await fetch(`/api/auto-apply/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_job_ids: jobs.filter((j) => j.selected).map((j) => j.job_id),
        }),
      });
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleConfirmApply() {
    if (selectedCount === 0) return;
    setConfirming(true);
    try {
      // Save selections first
      await fetch(`/api/auto-apply/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selected_job_ids: jobs.filter((j) => j.selected).map((j) => j.job_id),
        }),
      });

      const res = await fetch(`/api/auto-apply/${runId}/confirm`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setJobs((prev) =>
          prev.map((j) => (j.selected ? { ...j, applied: true } : j))
        );
        setConfirmed(true);
        onComplete();
        alert(`Successfully applied to ${data.applied_count} jobs!`);
      }
    } catch { /* ignore */ }
    finally { setConfirming(false); }
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-200 bg-card p-3 sm:p-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-text">
              {selectedCount} job{selectedCount !== 1 ? "s" : ""} selected
            </p>
            <p className="text-xs text-text-muted">
              Applications will be tracked in your Applications page
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleSaveSelections}
              disabled={saving}
              className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 min-h-[44px] text-xs font-medium text-text hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Save
            </button>
            <button
              onClick={handleConfirmApply}
              disabled={confirming || selectedCount === 0}
              className="flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 min-h-[44px] text-xs font-medium text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 transition-colors"
            >
              {confirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Apply to {selectedCount} Job{selectedCount !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}

      {confirmed && (
        <div className="flex items-start sm:items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 sm:p-4">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-xs sm:text-sm font-medium text-green-800">
            Applications submitted! Check your Applications page for tracking.
          </p>
        </div>
      )}
    </div>
  );
}
