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
      <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-16" />
      </div>
    );
  }

  const progressToNext = streak.next_reward_at > 0
    ? Math.min(100, Math.round((streak.current_streak / streak.next_reward_at) * 100))
    : 100;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-100">
            <Flame className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-amber-700 md:text-3xl">{streak.current_streak}</span>
              <span className="text-xs text-amber-700/90 sm:text-sm">day streak</span>
            </div>
            <p className="truncate text-[10px] text-amber-600/90 sm:text-xs">{streak.streak_level}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs sm:gap-3">
          {streak.streak_multiplier > 1 && (
            <div className="flex min-h-[28px] items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1">
              <Zap className="h-3 w-3 text-amber-600 sm:h-3.5 sm:w-3.5" />
              <span className="font-medium text-amber-800">{streak.streak_multiplier}x XP</span>
            </div>
          )}
          {streak.streak_freeze_count > 0 && (
            <div className="flex min-h-[28px] items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
              <Shield className="h-3 w-3 text-slate-600 sm:h-3.5 sm:w-3.5" />
              <span className="font-medium text-slate-700">{streak.streak_freeze_count} freeze</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar to next reward */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-slate-500 sm:text-xs">
          <span className="truncate">Next reward at {streak.next_reward_at} days</span>
          <span className="ml-2 shrink-0">{progressToNext}%</span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${progressToNext}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] sm:gap-3 sm:text-xs">
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 sm:py-3">
          <div className="text-sm font-bold text-amber-700 sm:text-base">{streak.longest_streak}</div>
          <div className="truncate text-amber-600/90">Best Streak</div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 sm:py-3">
          <div className="text-sm font-bold text-amber-700 sm:text-base">{streak.total_active_days}</div>
          <div className="truncate text-amber-600/90">Active Days</div>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 sm:py-3">
          <div className="flex items-center justify-center gap-0.5 text-sm font-bold text-amber-700 sm:text-base">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            {streak.xp_points}
          </div>
          <div className="truncate text-amber-600/90">XP Points</div>
        </div>
      </div>
    </div>
  );
}
