"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { dashboardKeys } from "@/hooks/queries/use-dashboard";

export type CoverLetterApiRow = {
  id: string;
  company_name: string | null;
  job_title: string | null;
  content: string;
};

export function useCoverLetterContent() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<CoverLetterApiRow>(`/api/cover-letters/${id}`),
  });
}

export function usePatchCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      apiFetch<{ id: string; content: string }>(`/api/cover-letters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dashboardKeys.history() });
    },
  });
}

export function useDeleteCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/api/cover-letters/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: dashboardKeys.history() });
    },
  });
}
