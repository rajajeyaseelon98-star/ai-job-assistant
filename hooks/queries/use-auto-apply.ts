"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import type { AutoApplyRun } from "@/types/autoApply";

export const autoApplyKeys = {
  all: ["auto-apply"] as const,
  pastRuns: () => [...autoApplyKeys.all, "past-runs"] as const,
  run: (id: string) => [...autoApplyKeys.all, "run", id] as const,
};

export function usePastRuns() {
  return useQuery({
    queryKey: autoApplyKeys.pastRuns(),
    queryFn: () => apiFetch<AutoApplyRun[]>("/api/auto-apply").catch(() => []),
    staleTime: 30 * 1000,
  });
}

export function useAutoApplyRun(
  runId: string | null,
  opts?: { refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: autoApplyKeys.run(runId ?? ""),
    queryFn: () => apiFetch<AutoApplyRun>(`/api/auto-apply/${runId}`),
    enabled: !!runId,
    staleTime: 0,
    refetchInterval: opts?.refetchInterval ?? false,
  });
}

export function useStartAutoApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: Record<string, unknown>) =>
      apiFetch<AutoApplyRun>("/api/auto-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: autoApplyKeys.pastRuns() });
    },
  });
}

export function usePatchAutoApplySelections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      runId,
      selected_job_ids,
    }: {
      runId: string;
      selected_job_ids: string[];
    }) =>
      apiFetch<unknown>(`/api/auto-apply/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_job_ids }),
      }),
    onSuccess: (_, { runId }) => {
      void qc.invalidateQueries({ queryKey: autoApplyKeys.run(runId) });
      void qc.invalidateQueries({ queryKey: autoApplyKeys.pastRuns() });
    },
  });
}

export function useConfirmAutoApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) =>
      apiFetch<{ success?: boolean; applied_count: number; total_selected?: number }>(
        `/api/auto-apply/${runId}/confirm`,
        { method: "POST" }
      ),
    onSuccess: (_, runId) => {
      void qc.invalidateQueries({ queryKey: autoApplyKeys.run(runId) });
      void qc.invalidateQueries({ queryKey: autoApplyKeys.pastRuns() });
      void qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
