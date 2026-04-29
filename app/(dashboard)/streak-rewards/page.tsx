"use client";

import { useStreakRewards, useClaimReward } from "@/hooks/queries/use-streak-rewards";
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
  const { data, isLoading: loading } = useStreakRewards();
  const claimMutation = useClaimReward();

  const streak = data?.streak ?? null;
  const rewards = data?.rewards ?? [];
  const claiming = claimMutation.isPending ? claimMutation.variables : null;

  async function claimReward(days: number) {
    try {
      await claimMutation.mutateAsync(days);
    } catch { /* mutation error handled by React Query */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Gift className="h-6 w-6 text-indigo-600" />
          Streak Rewards
        </h1>
        <p className="text-slate-500 text-base mt-2">
          Stay consistent. Earn real rewards that help you get more interviews.
        </p>
      </div>

      {/* Current Streak */}
      {streak && (
        <div className="bg-slate-900 rounded-3xl p-8 mb-10 text-white relative overflow-hidden shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400 mb-4">
                <Flame className="h-8 w-8" />
              </div>
              <span className="block font-display text-5xl font-bold tracking-tight">{streak.current_streak}</span>
              <div className="text-orange-400 text-sm font-semibold flex items-center gap-2 mt-1">
                <Flame className="h-4 w-4" />
                {streak.streak_level}
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">XP Points</div>
              <span className="block font-display text-3xl font-bold text-indigo-400">{streak.xp_points}</span>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {streak.streak_multiplier}x Multiplier
              </div>
            </div>
          </div>
          {/* Progress to next reward */}
          <div className="w-full h-3 bg-white/10 rounded-full mt-8 relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full"
              style={{
                width: `${Math.min(100, (streak.current_streak / streak.next_reward_at) * 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-3">
            <span>Current: {streak.current_streak}d</span>
            <span>Longest: {streak.longest_streak}d</span>
            <span>Next: {streak.next_reward_at}d</span>
            <span>Freezes: {streak.streak_freeze_count}</span>
          </div>
        </div>
      )}

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {rewards.map((r) => {
          const Icon = REWARD_ICONS[r.reward_type] || Gift;
          const isUnlocked = streak && streak.current_streak >= r.streak_days;
          const canClaim = isUnlocked && !r.claimed;

          return (
            <div
              key={r.streak_days}
              className={`rounded-2xl p-6 flex items-start gap-4 transition-all ${
                isUnlocked || r.claimed
                  ? "shadow-md border-indigo-200 bg-white scale-[1.02]"
                  : "opacity-60 grayscale bg-slate-50 border border-slate-200"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                {r.claimed ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                ) : isUnlocked ? (
                  <Icon className="h-5 w-5 text-indigo-500" />
                ) : (
                  <Lock className="h-5 w-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display font-bold text-slate-900">{r.title}</span>
                  <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                    {r.streak_days} days
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
              </div>

              {canClaim && (
                <button
                  onClick={() => claimReward(r.streak_days)}
                  disabled={claiming === r.streak_days}
                  className="mt-3 w-full min-h-[44px] rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
                >
                  {claiming === r.streak_days ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    "Claim Reward"
                  )}
                </button>
              )}
              {r.claimed && (
                <div className="mt-3 text-sm font-medium text-emerald-600">
                  ✓ Claimed
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8">
        <h3 className="font-display text-lg font-bold text-slate-900 mb-6">How Streak Rewards Work</h3>
        <ul className="space-y-4">
          <li className="flex gap-3 text-sm text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
            Complete any action daily (apply, analyze resume, prep interview) to maintain your streak
          </li>
          <li className="flex gap-3 text-sm text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
            Missing a day resets your streak — use streak freeze tokens to protect it
          </li>
          <li className="flex gap-3 text-sm text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
            Each reward is real value: auto-apply credits, profile boosts, pro trials
          </li>
          <li className="flex gap-3 text-sm text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
            Your XP multiplier increases with longer streaks (up to 2x at 30 days)
          </li>
        </ul>
      </div>
    </div>
  );
}
