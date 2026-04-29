"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { recruiterKeys } from "./recruiter-keys";

export type UnreadSummaryResponse = { counts: Record<string, number> };

export function useMessageUnreadSummary() {
  return useQuery({
    queryKey: recruiterKeys.unreadSummary(),
    queryFn: () => apiFetch<UnreadSummaryResponse>("/api/messages/unread-summary"),
    staleTime: 20 * 1000,
    // Resilience fallback when Realtime is unavailable/misconfigured.
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });
}
