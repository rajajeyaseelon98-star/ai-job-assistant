"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

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

interface DailyActionsResponse {
  actions: DailyAction[];
  progress: DailyProgress;
}

export const dailyActionsKeys = {
  all: ["daily-actions"] as const,
};

export function useDailyActions() {
  return useQuery({
    queryKey: dailyActionsKeys.all,
    queryFn: () => apiFetch<DailyActionsResponse>("/api/daily-actions"),
    staleTime: 60 * 1000,
  });
}

export function useCompleteDailyAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) =>
      apiFetch<{ success: boolean; progress: DailyProgress }>("/api/daily-actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: actionId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dailyActionsKeys.all });
    },
  });
}
