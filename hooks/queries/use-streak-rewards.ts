"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

interface StreakReward {
  streak_days: number;
  title: string;
  description: string;
  reward_type: string;
  value: number;
  claimed: boolean;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  streak_level: string;
  streak_multiplier: number;
  xp_points: number;
  next_reward_at: number;
  streak_freeze_count: number;
}

interface StreakRewardsResponse {
  streak: UserStreak;
  rewards: StreakReward[];
}

export const streakRewardsKeys = {
  all: ["streak-rewards"] as const,
  detail: () => [...streakRewardsKeys.all, "detail"] as const,
};

export function useStreakRewards() {
  return useQuery({
    queryKey: streakRewardsKeys.detail(),
    queryFn: () => apiFetch<StreakRewardsResponse>("/api/streak-rewards"),
    staleTime: 2 * 60 * 1000,
  });
}

export function useClaimReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (streakDays: number) =>
      apiFetch("/api/streak-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streak_days: streakDays }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: streakRewardsKeys.all });
    },
  });
}
