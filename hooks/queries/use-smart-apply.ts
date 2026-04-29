"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { sharedQueryKeys } from "@/hooks/queries/shared-query-keys";
import type { SmartApplyRule } from "@/types/autoApply";

interface Resume {
  id: string;
  file_name: string;
  created_at: string;
}

export const smartApplyKeys = {
  all: ["smart-apply"] as const,
  rules: () => [...smartApplyKeys.all, "rules"] as const,
  resumes: sharedQueryKeys.resumes,
  usage: () => ["shared", "usage"] as const,
};

export function useSmartApplyRules() {
  return useQuery({
    queryKey: smartApplyKeys.rules(),
    queryFn: () => apiFetch<SmartApplyRule[]>("/api/smart-apply").catch(() => []),
    staleTime: 60 * 1000,
  });
}

export function useResumes() {
  return useQuery({
    queryKey: smartApplyKeys.resumes(),
    queryFn: () => apiFetch<Resume[]>("/api/upload-resume").catch(() => []),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUsage() {
  return useQuery({
    queryKey: smartApplyKeys.usage(),
    queryFn: () =>
      apiFetch<{ smart_apply: { used: number; limit: number } }>("/api/usage").catch(() => null),
    staleTime: 60 * 1000,
  });
}

export function useSaveSmartApplyRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<SmartApplyRule>("/api/smart-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: smartApplyKeys.rules() });
    },
  });
}

export function useToggleSmartApplyRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      apiFetch("/api/smart-apply", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: smartApplyKeys.rules() });
    },
  });
}
