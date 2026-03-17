"use client";

import { useState, useEffect } from "react";
import {
  Flame,
  Gift,
  Loader2,
  Lock,
  CheckCircle,
  Shield,
  Rocket,
  Zap,
  Crown,
  Star,
} from "lucide-react";

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

const REWARD_ICONS: Record<string, React.ElementType> = {
  streak_freeze: Shield,
  auto_apply_credit: Rocket,
  profile_boost: Zap,
  pro_trial: Crown,
  permanent_boost: Star,
};

export default function StreakRewardsPage() {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [rewards, setRewards] = useState<StreakReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/streak-rewards")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setStreak(data.streak);
          setRewards(data.rewards);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function claimReward(days: number) {
    setClaiming(days);
    try {
      const res = await fetch("/api/streak-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streak_days: days }),
      });
      if (res.ok) {
        setRewards((prev) =>
          prev.map((r) => (r.streak_days === days ? { ...r, claimed: true } : r))
        );
      }
    } catch {
      // handle silently
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-text">
          <Gift className="h-6 w-6 text-primary" />
          Streak Rewards
        </h1>
        <p className="text-sm text-text-muted">
          Stay consistent. Earn real rewards that help you get more interviews.
        </p>
      </div>

      {/* Current Streak */}
      {streak && (
        <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-2xl">
                <Flame className="h-7 w-7 text-orange-500" />
              </div>
              <div>
                <div className="text-3xl font-bold text-text">{streak.current_streak} days</div>
                <div className="text-sm text-text-muted">{streak.streak_level}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-text-muted">XP Points</div>
              <div className="text-xl font-bold text-primary">{streak.xp_points}</div>
              <div className="text-xs text-text-muted">{streak.streak_multiplier}x multiplier</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-text-muted">
            <span>Longest: {streak.longest_streak} days</span>
            <span>·</span>
            <span>Next reward at: {streak.next_reward_at} days</span>
            <span>·</span>
            <span>Freezes: {streak.streak_freeze_count}</span>
          </div>
          {/* Progress to next reward */}
          <div className="mt-3">
            <div className="h-2 rounded-full bg-orange-200">
              <div
                className="h-2 rounded-full bg-orange-400 transition-all"
                style={{
                  width: `${Math.min(100, (streak.current_streak / streak.next_reward_at) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-text-muted">
              <span>{streak.current_streak} days</span>
              <span>{streak.next_reward_at} days</span>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {rewards.map((r) => {
          const Icon = REWARD_ICONS[r.reward_type] || Gift;
          const isUnlocked = streak && streak.current_streak >= r.streak_days;
          const canClaim = isUnlocked && !r.claimed;

          return (
            <div
              key={r.streak_days}
              className={`rounded-xl border p-5 transition-all ${
                r.claimed
                  ? "border-green-200 bg-green-50/50"
                  : isUnlocked
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 bg-card opacity-75"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      r.claimed
                        ? "bg-green-100"
                        : isUnlocked
                        ? "bg-primary/10"
                        : "bg-gray-100"
                    }`}
                  >
                    {r.claimed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : isUnlocked ? (
                      <Icon className="h-5 w-5 text-primary" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text">{r.title}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-text-muted">
                        {r.streak_days} days
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-text-muted">{r.description}</p>
                  </div>
                </div>
              </div>

              {canClaim && (
                <button
                  onClick={() => claimReward(r.streak_days)}
                  disabled={claiming === r.streak_days}
                  className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {claiming === r.streak_days ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Claim Reward"
                  )}
                </button>
              )}
              {r.claimed && (
                <div className="mt-3 text-center text-sm font-medium text-green-600">
                  ✓ Claimed
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      <div className="rounded-xl border border-gray-200 bg-card p-5 text-sm text-text-muted">
        <h3 className="mb-2 font-medium text-text">How Streak Rewards Work</h3>
        <ul className="space-y-1">
          <li>• Complete any action daily (apply, analyze resume, prep interview) to maintain your streak</li>
          <li>• Missing a day resets your streak — use streak freeze tokens to protect it</li>
          <li>• Each reward is real value: auto-apply credits, profile boosts, pro trials</li>
          <li>• Your XP multiplier increases with longer streaks (up to 2x at 30 days)</li>
        </ul>
      </div>
    </div>
  );
}
