import { createClient } from "@/lib/supabase/server";
import { checkAndClaimRewards } from "@/lib/streakRewards";

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  total_active_days: number;
  streak_multiplier: number;
  streak_level: string;
  next_reward_at: number;
  xp_points: number;
  streak_freeze_count: number;
}

const STREAK_LEVELS = [
  { min: 0, label: "Newcomer", emoji: "🌱" },
  { min: 3, label: "Getting Started", emoji: "🔥" },
  { min: 7, label: "On a Roll", emoji: "⚡" },
  { min: 14, label: "Dedicated", emoji: "💪" },
  { min: 30, label: "Unstoppable", emoji: "🚀" },
  { min: 60, label: "Legend", emoji: "👑" },
  { min: 100, label: "Champion", emoji: "🏆" },
];

const STREAK_REWARDS = [3, 7, 14, 21, 30, 50, 75, 100];
const XP_PER_ACTION: Record<string, number> = {
  apply: 10,
  resume_analyze: 15,
  resume_improve: 20,
  job_match: 10,
  cover_letter: 15,
  interview_prep: 25,
  daily_login: 5,
  streak_bonus: 0, // calculated dynamically
};

function getStreakLevel(streak: number): string {
  let level = STREAK_LEVELS[0].label;
  for (const l of STREAK_LEVELS) {
    if (streak >= l.min) level = `${l.emoji} ${l.label}`;
  }
  return level;
}

function getNextRewardAt(streak: number): number {
  for (const r of STREAK_REWARDS) {
    if (streak < r) return r;
  }
  return streak + 25; // After 100, every 25 days
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

/**
 * Get or create a user's streak data.
 */
export async function getUserStreak(userId: string): Promise<UserStreak> {
  const supabase = await createClient();

  const [{ data: streak }, { data: userRow }] = await Promise.all([
    supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .single(),
    supabase
      .from("users")
      .select("xp_points, streak_freeze_count")
      .eq("id", userId)
      .single(),
  ]);

  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;

  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_active_date: streak?.last_active_date || null,
    total_active_days: streak?.total_active_days || 0,
    streak_multiplier: getStreakMultiplier(currentStreak),
    streak_level: getStreakLevel(currentStreak),
    next_reward_at: getNextRewardAt(currentStreak),
    xp_points: userRow?.xp_points || 0,
    streak_freeze_count: userRow?.streak_freeze_count || 0,
  };
}

/**
 * Record a daily activity and update streak.
 * Call this whenever a user performs a meaningful action.
 * Returns { streakUpdated, newStreak, xpEarned }
 */
export async function recordDailyActivity(
  userId: string,
  actionType: string = "daily_login"
): Promise<{ streakUpdated: boolean; newStreak: number; xpEarned: number }> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Get or create streak row
  const { data: existing } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  const baseXp = XP_PER_ACTION[actionType] || 5;

  if (!existing) {
    // First time user — create streak
    await supabase.from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
      total_active_days: 1,
      streak_multiplier: 1.0,
    });

    // Award XP
    await awardXp(supabase, userId, baseXp);

    return { streakUpdated: true, newStreak: 1, xpEarned: baseXp };
  }

  const lastActive = existing.last_active_date;

  // Already active today
  if (lastActive === today) {
    // Still award XP for the action
    const xp = Math.round(baseXp * getStreakMultiplier(existing.current_streak));
    await awardXp(supabase, userId, xp);
    return { streakUpdated: false, newStreak: existing.current_streak, xpEarned: xp };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;
  if (lastActive === yesterdayStr) {
    // Consecutive day — increment streak
    newStreak = existing.current_streak + 1;
  } else {
    // Streak broken — check for streak freeze
    const { data: userRow } = await supabase
      .from("users")
      .select("streak_freeze_count")
      .eq("id", userId)
      .single();

    const daysBefore2 = new Date();
    daysBefore2.setDate(daysBefore2.getDate() - 2);
    const daysBefore2Str = daysBefore2.toISOString().split("T")[0];

    if ((userRow?.streak_freeze_count || 0) > 0 && lastActive === daysBefore2Str) {
      // Use streak freeze — missed only 1 day
      newStreak = existing.current_streak + 1;
      await supabase
        .from("users")
        .update({ streak_freeze_count: (userRow?.streak_freeze_count || 1) - 1 })
        .eq("id", userId);
    } else {
      // Streak resets
      newStreak = 1;
    }
  }

  const newLongest = Math.max(existing.longest_streak, newStreak);
  const multiplier = getStreakMultiplier(newStreak);
  const xpEarned = Math.round(baseXp * multiplier);

  // Check if hitting a reward milestone
  const isRewardMilestone = STREAK_REWARDS.includes(newStreak);
  const bonusXp = isRewardMilestone ? newStreak * 5 : 0;

  await supabase
    .from("user_streaks")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: today,
      total_active_days: existing.total_active_days + 1,
      streak_multiplier: multiplier,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  await awardXp(supabase, userId, xpEarned + bonusXp);

  // Update last_active_at on users table
  await supabase
    .from("users")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", userId);

  // Auto-claim streak rewards
  checkAndClaimRewards(userId, newStreak).catch(() => {});

  return { streakUpdated: true, newStreak, xpEarned: xpEarned + bonusXp };
}

async function awardXp(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  amount: number
): Promise<void> {
  if (amount <= 0) return;
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data } = await supabase
        .from("users")
        .select("xp_points")
        .eq("id", userId)
        .single();

      const currentXp = data?.xp_points || 0;
      const newXp = currentXp + amount;

      // Use the current value as a condition to detect concurrent modifications
      const { data: updated, error } = await supabase
        .from("users")
        .update({ xp_points: newXp })
        .eq("id", userId)
        .eq("xp_points", currentXp)
        .select("id")
        .single();

      if (updated && !error) return; // Success
      // If no row was updated, another request changed xp_points — retry
      if (attempt < maxRetries - 1) continue;

      // Final fallback: just do the update without the check (better than losing XP)
      await supabase
        .from("users")
        .update({ xp_points: newXp })
        .eq("id", userId);
      return;
    } catch {
      // Non-critical — XP is best-effort
      return;
    }
  }
}

/**
 * Get streak leaderboard (top streakers on the platform).
 */
export async function getStreakLeaderboard(limit = 10): Promise<
  Array<{ user_id: string; current_streak: number; longest_streak: number; total_active_days: number }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_streaks")
    .select("user_id, current_streak, longest_streak, total_active_days")
    .order("current_streak", { ascending: false })
    .limit(limit);

  return data || [];
}
