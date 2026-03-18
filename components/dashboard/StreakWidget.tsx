"use client";

import { useState, useEffect } from "react";
import { Flame, Trophy, Zap, Shield } from "lucide-react";

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

export function StreakWidget() {
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Record daily login + fetch streak
    fetch("/api/streak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action_type: "daily_login" }) })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    fetch("/api/streak")
      .then((r) => (r.ok ? r.json() : null))
      .then(setStreak)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !streak) {
    return (
      <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 animate-pulse">
        <div className="h-16" />
      </div>
    );
  }

  const progressToNext = streak.next_reward_at > 0
    ? Math.min(100, Math.round((streak.current_streak / streak.next_reward_at) * 100))
    : 100;

  return (
    <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-700">{streak.current_streak}</span>
              <span className="text-xs sm:text-sm text-orange-600">day streak</span>
            </div>
            <p className="text-[10px] sm:text-xs text-orange-500 truncate">{streak.streak_level}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {streak.streak_multiplier > 1 && (
            <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 min-h-[28px]">
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-600" />
              <span className="font-medium text-yellow-700">{streak.streak_multiplier}x XP</span>
            </div>
          )}
          {streak.streak_freeze_count > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 min-h-[28px]">
              <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
              <span className="font-medium text-blue-700">{streak.streak_freeze_count} freeze</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar to next reward */}
      <div className="mt-3 sm:mt-4">
        <div className="flex items-center justify-between text-[10px] sm:text-xs text-orange-500">
          <span className="truncate">Next reward at {streak.next_reward_at} days</span>
          <span className="shrink-0 ml-2">{progressToNext}%</span>
        </div>
        <div className="mt-1 h-1.5 sm:h-2 rounded-full bg-orange-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all"
            style={{ width: `${progressToNext}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 sm:mt-4 grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 text-center text-[10px] sm:text-xs">
        <div className="rounded-lg bg-white/40 px-2 py-2 sm:py-3">
          <div className="font-bold text-sm sm:text-base text-orange-700">{streak.longest_streak}</div>
          <div className="text-orange-500 truncate">Best Streak</div>
        </div>
        <div className="rounded-lg bg-white/40 px-2 py-2 sm:py-3">
          <div className="font-bold text-sm sm:text-base text-orange-700">{streak.total_active_days}</div>
          <div className="text-orange-500 truncate">Active Days</div>
        </div>
        <div className="rounded-lg bg-white/40 px-2 py-2 sm:py-3">
          <div className="flex items-center justify-center gap-0.5 font-bold text-sm sm:text-base text-orange-700">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            {streak.xp_points}
          </div>
          <div className="text-orange-500 truncate">XP Points</div>
        </div>
      </div>
    </div>
  );
}
