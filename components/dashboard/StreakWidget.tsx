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
      <div className="rounded-xl border border-gray-200 bg-card p-4 animate-pulse">
        <div className="h-16" />
      </div>
    );
  }

  const progressToNext = streak.next_reward_at > 0
    ? Math.min(100, Math.round((streak.current_streak / streak.next_reward_at) * 100))
    : 100;

  return (
    <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-orange-700">{streak.current_streak}</span>
              <span className="text-sm text-orange-600">day streak</span>
            </div>
            <p className="text-xs text-orange-500">{streak.streak_level}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {streak.streak_multiplier > 1 && (
            <div className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1">
              <Zap className="h-3 w-3 text-yellow-600" />
              <span className="font-medium text-yellow-700">{streak.streak_multiplier}x XP</span>
            </div>
          )}
          {streak.streak_freeze_count > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1">
              <Shield className="h-3 w-3 text-blue-600" />
              <span className="font-medium text-blue-700">{streak.streak_freeze_count} freeze</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar to next reward */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-orange-500">
          <span>Next reward at {streak.next_reward_at} days</span>
          <span>{progressToNext}%</span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-orange-200">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all"
            style={{ width: `${progressToNext}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
        <div>
          <div className="font-bold text-orange-700">{streak.longest_streak}</div>
          <div className="text-orange-500">Best Streak</div>
        </div>
        <div>
          <div className="font-bold text-orange-700">{streak.total_active_days}</div>
          <div className="text-orange-500">Active Days</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-0.5 font-bold text-orange-700">
            <Trophy className="h-3 w-3" />
            {streak.xp_points}
          </div>
          <div className="text-orange-500">XP Points</div>
        </div>
      </div>
    </div>
  );
}
