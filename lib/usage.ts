import { createClient } from "./supabase/server";
import type { FeatureType } from "./usage-limits";
import { FREE_PLAN_LIMITS } from "./usage-limits";

export type { FeatureType } from "./usage-limits";
export { FREE_PLAN_LIMITS } from "./usage-limits";

const FREE_LIMITS = FREE_PLAN_LIMITS;

/** Get current usage count for a feature in the current period (e.g. monthly). */
export async function getUsageCount(
  userId: string,
  feature: FeatureType
): Promise<number> {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("timestamp", startOfMonth.toISOString());

  if (error) return 0;
  return count ?? 0;
}

/**
 * Check if user can use the feature (under free limit or pro/premium).
 * For Pro/Premium users, also returns actual usage for dashboard display.
 */
export async function canUseFeature(
  userId: string,
  feature: FeatureType,
  planType: "free" | "pro" | "premium"
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (planType === "pro" || planType === "premium") {
    // Still fetch actual usage for dashboard display accuracy (LOGIC-02 fix)
    const used = await getUsageCount(userId, feature);
    return { allowed: true, used, limit: -1 };
  }
  const used = await getUsageCount(userId, feature);
  const limit = FREE_LIMITS[feature];
  return {
    allowed: used < limit,
    used,
    limit,
  };
}

/**
 * Atomically check usage limit and log in a single operation to prevent TOCTOU race conditions.
 * Returns { allowed, used, limit }. If allowed, the usage is already logged.
 * This prevents two concurrent requests from both passing the limit check (BUG-002 fix).
 */
export async function checkAndLogUsage(
  userId: string,
  feature: FeatureType,
  planType: "free" | "pro" | "premium"
): Promise<{ allowed: boolean; used: number; limit: number }> {
  // Pro/Premium users always allowed — log usage and return accurate monthly count for UI
  if (planType === "pro" || planType === "premium") {
    await logUsage(userId, feature);
    const used = await getUsageCount(userId, feature);
    return { allowed: true, used, limit: -1 };
  }

  const limit = FREE_LIMITS[feature];

  // For features with 0 limit, no need to check DB
  if (limit <= 0) {
    return { allowed: false, used: 0, limit };
  }

  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Insert the usage log first (optimistic)
  const { error: insertError } = await supabase
    .from("usage_logs")
    .insert({ user_id: userId, feature });

  if (insertError) {
    // If insert fails, fall back to check-only
    const used = await getUsageCount(userId, feature);
    return { allowed: used < limit, used, limit };
  }

  // Now count AFTER insert — if count > limit, we went over, so delete and deny
  const { count, error: countError } = await supabase
    .from("usage_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("timestamp", startOfMonth.toISOString());

  const used = count ?? 0;

  if (countError) {
    return { allowed: true, used, limit }; // Fail-open
  }

  if (used > limit) {
    // Over limit — delete the log we just inserted (rollback)
    // Get the most recent one to delete
    const { data: lastLog } = await supabase
      .from("usage_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("feature", feature)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    if (lastLog) {
      await supabase.from("usage_logs").delete().eq("id", lastLog.id);
    }

    return { allowed: false, used: used - 1, limit };
  }

  return { allowed: true, used, limit };
}

/** Log usage (simple insert, use checkAndLogUsage for atomic check+log). */
export async function logUsage(
  userId: string,
  feature: FeatureType
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("usage_logs").insert({ user_id: userId, feature });
}

const ALL_FEATURES: FeatureType[] = [
  "resume_analysis",
  "job_match",
  "cover_letter",
  "interview_prep",
  "resume_improve",
  "job_finder",
  "auto_apply",
  "smart_apply",
];

/**
 * Get usage summary for dashboard (current month).
 * Uses efficient COUNT queries grouped by feature instead of fetching all rows (BUG-009 fix).
 */
export async function getUsageSummary(userId: string, planType: "free" | "pro" | "premium") {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Use count queries per feature — more efficient than fetching all rows
  // For users with hundreds of monthly actions, this avoids loading all rows into JS memory
  const counts: Record<string, number> = {};

  // Per-feature exact COUNT (monthly) — avoids undercounting power users (no 500-row cap)
  const from = startOfMonth.toISOString();
  const countResults = await Promise.all(
    ALL_FEATURES.map(async (feature) => {
      const { count, error } = await supabase
        .from("usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("feature", feature)
        .gte("timestamp", from);
      if (error) return { feature, count: 0 };
      return { feature, count: count ?? 0 };
    })
  );
  for (const { feature, count } of countResults) {
    counts[feature] = count;
  }

  const summary = {} as Record<FeatureType, { used: number; limit: number }>;
  for (const f of ALL_FEATURES) {
    const limit = planType === "pro" || planType === "premium" ? -1 : FREE_LIMITS[f];
    summary[f] = { used: counts[f] || 0, limit };
  }
  return summary;
}
