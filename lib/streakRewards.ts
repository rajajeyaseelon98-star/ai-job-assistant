import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { activateBoost } from "@/lib/candidateBoost";

/**
 * Streak Rewards — Real value rewards for maintaining streaks.
 *
 * Reward tiers:
 * - 3 days  → 1 streak freeze token
 * - 7 days  → 1 free auto-apply credit
 * - 14 days → 3-day profile boost (2x visibility)
 * - 21 days → 2 streak freeze tokens
 * - 30 days → 7-day profile boost (2x) + 3 free auto-applies
 * - 50 days → 14-day profile boost (2.5x)
 * - 75 days → Pro trial (7 days) if on free plan
 * - 100 days → Permanent 1.5x boost multiplier
 */

export interface StreakReward {
  streak_days: number;
  title: string;
  description: string;
  reward_type: "streak_freeze" | "auto_apply_credit" | "profile_boost" | "pro_trial" | "permanent_boost";
  value: number; // quantity or days
  claimed: boolean;
}

const REWARD_DEFINITIONS: Array<{
  days: number;
  title: string;
  description: string;
  reward_type: StreakReward["reward_type"];
  value: number;
}> = [
  { days: 3, title: "Streak Shield", description: "1 streak freeze token — miss a day without losing your streak", reward_type: "streak_freeze", value: 1 },
  { days: 7, title: "Free Auto-Apply", description: "1 bonus auto-apply credit — find and apply to jobs automatically", reward_type: "auto_apply_credit", value: 1 },
  { days: 14, title: "Profile Boost", description: "3-day 2x visibility boost — recruiters see you first", reward_type: "profile_boost", value: 3 },
  { days: 21, title: "Double Shield", description: "2 streak freeze tokens — extra protection for your streak", reward_type: "streak_freeze", value: 2 },
  { days: 30, title: "Power Pack", description: "7-day 2x boost + 3 free auto-applies — maximum interview potential", reward_type: "profile_boost", value: 7 },
  { days: 50, title: "Elite Boost", description: "14-day 2.5x visibility boost — top recruiter priority", reward_type: "profile_boost", value: 14 },
  { days: 75, title: "Pro Preview", description: "7-day Pro trial — unlock all premium features", reward_type: "pro_trial", value: 7 },
  { days: 100, title: "Legend Status", description: "Permanent 1.5x visibility multiplier — you earned it", reward_type: "permanent_boost", value: 0 },
];

/**
 * Get available and claimed rewards for a user.
 */
export async function getStreakRewards(userId: string, currentStreak: number): Promise<StreakReward[]> {
  const supabase = await createClient();

  // Check which rewards have been claimed
  const { data: claimed } = await supabase
    .from("activity_feed")
    .select("metadata")
    .eq("user_id", userId)
    .eq("activity_type", "milestone")
    .contains("metadata", { reward_claimed: true });

  const claimedDays = new Set(
    (claimed || [])
      .map((c) => (c.metadata as Record<string, unknown>)?.streak_reward_days as number)
      .filter(Boolean)
  );

  return REWARD_DEFINITIONS.map((r) => ({
    streak_days: r.days,
    title: r.title,
    description: r.description,
    reward_type: r.reward_type,
    value: r.value,
    claimed: claimedDays.has(r.days),
  })).filter((r) => r.streak_days <= currentStreak || r.streak_days <= currentStreak + 10);
}

/**
 * Claim a streak reward. Called when user hits a milestone.
 */
export async function claimStreakReward(
  userId: string,
  streakDays: number
): Promise<{ success: boolean; message: string }> {
  const reward = REWARD_DEFINITIONS.find((r) => r.days === streakDays);
  if (!reward) return { success: false, message: "No reward at this streak level" };

  const supabase = await createClient();

  // Check if already claimed
  const { count } = await supabase
    .from("activity_feed")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("activity_type", "milestone")
    .contains("metadata", { reward_claimed: true, streak_reward_days: streakDays });

  if (count && count > 0) {
    return { success: false, message: "Reward already claimed" };
  }

  // Grant the reward
  switch (reward.reward_type) {
    case "streak_freeze": {
      const { data: user } = await supabase
        .from("users")
        .select("streak_freeze_count")
        .eq("id", userId)
        .single();
      await supabase
        .from("users")
        .update({ streak_freeze_count: (user?.streak_freeze_count || 0) + reward.value })
        .eq("id", userId);
      break;
    }
    case "auto_apply_credit": {
      // Grant bonus credits by removing the most recent auto_apply usage logs
      // This effectively "gives back" usage, letting the user run more auto-applies
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: recentLogs } = await supabase
        .from("usage_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("feature", "auto_apply")
        .gte("timestamp", startOfMonth.toISOString())
        .order("timestamp", { ascending: false })
        .limit(reward.value);

      if (recentLogs && recentLogs.length > 0) {
        await supabase
          .from("usage_logs")
          .delete()
          .in("id", recentLogs.map((l) => l.id));
      }

      await createNotification(
        userId,
        "success",
        `🎁 ${reward.title} Earned!`,
        `You've earned ${reward.value} bonus auto-apply credit(s). They're already active!`,
        { reward_type: "auto_apply_credit", value: reward.value }
      );
      break;
    }
    case "profile_boost": {
      const multiplier = streakDays >= 50 ? 2.5 : 2.0;
      await activateBoost(userId, reward.value, multiplier);
      // If 30-day reward, also grant 3 auto-apply credits
      if (streakDays === 30) {
        const autoApplyCredits = 3;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { data: recentLogs } = await supabase
          .from("usage_logs")
          .select("id")
          .eq("user_id", userId)
          .eq("feature", "auto_apply")
          .gte("timestamp", startOfMonth.toISOString())
          .order("timestamp", { ascending: false })
          .limit(autoApplyCredits);

        if (recentLogs && recentLogs.length > 0) {
          await supabase
            .from("usage_logs")
            .delete()
            .in("id", recentLogs.map((l) => l.id));
        }

        await createNotification(
          userId,
          "success",
          "🎁 Power Pack Activated!",
          "7-day 2x boost + 3 free auto-applies are now active!",
          { reward_type: "power_pack" }
        );
      }
      break;
    }
    case "pro_trial": {
      const { data: user } = await supabase
        .from("users")
        .select("plan_type")
        .eq("id", userId)
        .single();
      if (user?.plan_type === "free") {
        // Temporarily upgrade to pro with expiry tracked via boost_expires_at
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + reward.value);
        await supabase
          .from("users")
          .update({
            plan_type: "pro",
            boost_expires_at: trialEnd.toISOString(), // reuse as trial expiry marker
          })
          .eq("id", userId);
        await createNotification(
          userId,
          "success",
          "🎁 Pro Trial Activated!",
          `${reward.value}-day Pro trial is now active. All premium features unlocked! Expires ${trialEnd.toLocaleDateString()}.`,
          { reward_type: "pro_trial", days: reward.value, expires_at: trialEnd.toISOString() }
        );
      }
      break;
    }
    case "permanent_boost": {
      // Clear boost_expires_at so checkBoostStatus won't auto-expire it
      await supabase
        .from("users")
        .update({ boost_multiplier: 1.5, is_boosted: true, boost_expires_at: null })
        .eq("id", userId);
      break;
    }
  }

  // Log as claimed milestone
  await supabase.from("activity_feed").insert({
    user_id: userId,
    activity_type: "milestone",
    title: `${reward.title} — ${streakDays}-day streak reward claimed!`,
    description: reward.description,
    metadata: { reward_claimed: true, streak_reward_days: streakDays, reward_type: reward.reward_type },
    is_public: true,
  });

  await createNotification(
    userId,
    "success",
    `🏆 ${reward.title} Unlocked!`,
    reward.description,
    { streak_days: streakDays, reward_type: reward.reward_type }
  );

  return { success: true, message: `${reward.title} claimed!` };
}

/**
 * Auto-claim rewards when streak milestones are hit.
 * Called from recordDailyActivity.
 */
export async function checkAndClaimRewards(userId: string, newStreak: number): Promise<void> {
  const milestones = REWARD_DEFINITIONS.map((r) => r.days);
  if (milestones.includes(newStreak)) {
    await claimStreakReward(userId, newStreak).catch(() => {});
  }
}
