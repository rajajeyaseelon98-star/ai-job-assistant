"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  streak_multiplier: number;
  streak_level: string;
  next_reward_at: number;
  xp_points: number;
  streak_freeze_count: number;
}

export const streakKeys = {
  all: ["streak"] as const,
  detail: () => [...streakKeys.all, "detail"] as const,
};

export function useStreak() {
  return useQuery({
    queryKey: streakKeys.detail(),
    queryFn: () => apiFetch<StreakData>("/api/streak"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useRecordStreakLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch("/api/streak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_type: "daily_login" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: streakKeys.all });
    },
  });
}
