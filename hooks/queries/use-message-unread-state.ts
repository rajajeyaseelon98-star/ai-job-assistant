"use client";

import { useMemo } from "react";
import { useMessageUnreadSummary } from "./use-message-unread-summary";
import { useMessageUnreadRealtime } from "./use-message-unread-realtime";

export type MessageUnreadState = {
  counts: Record<string, number>;
  totalUnread: number;
  hasUnread: boolean;
  isLoading: boolean;
  error: unknown;
};

/** Shared unread state for badges (topbar/sidebar/etc). Normalizes to safe zero defaults. */
export function useMessageUnreadState(): MessageUnreadState {
  useMessageUnreadRealtime();
  const q = useMessageUnreadSummary();

  const counts = (q.data?.counts ?? {}) as Record<string, number>;
  const totalUnread = useMemo(() => {
    let sum = 0;
    for (const v of Object.values(counts)) sum += typeof v === "number" ? v : 0;
    return sum;
  }, [counts]);

  return {
    counts,
    totalUnread,
    hasUnread: totalUnread > 0,
    isLoading: q.isLoading,
    error: q.error,
  };
}

