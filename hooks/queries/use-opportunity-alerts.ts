"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

interface OpportunityAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  urgency: string;
  action_url: string | null;
  seen: boolean;
  dismissed: boolean;
  created_at: string;
}

export const alertKeys = {
  all: ["opportunity-alerts"] as const,
};

export function useOpportunityAlerts() {
  return useQuery({
    queryKey: alertKeys.all,
    queryFn: () => apiFetch<OpportunityAlert[]>("/api/opportunity-alerts"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTriggerAlertScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/api/opportunity-alerts/scan", { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch("/api/opportunity-alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alert_id: alertId, action: "dismiss" }),
      }),
    onMutate: async (alertId) => {
      await queryClient.cancelQueries({ queryKey: alertKeys.all });
      const prev = queryClient.getQueryData<OpportunityAlert[]>(alertKeys.all);
      queryClient.setQueryData<OpportunityAlert[]>(alertKeys.all, (old) =>
        old ? old.filter((a) => a.id !== alertId) : []
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) {
        queryClient.setQueryData(alertKeys.all, context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.all });
    },
  });
}
