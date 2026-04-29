"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  /** JSON payload — e.g. message notifications include `sender_id`, `message_id`. */
  data?: Record<string, unknown> | null;
}

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => apiFetch<AppNotification[]>("/api/notifications").catch(() => []),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all_read: true }),
      }),
    onSuccess: () => {
      qc.setQueryData<AppNotification[]>(notificationKeys.list(), (old) =>
        (old ?? []).map((n) => ({ ...n, read: true }))
      );
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }),
    onSuccess: (_void, id) => {
      qc.setQueryData<AppNotification[]>(notificationKeys.list(), (old) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
