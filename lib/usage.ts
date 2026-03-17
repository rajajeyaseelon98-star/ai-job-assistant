import { createClient } from "./supabase/server";

export type FeatureType =
  | "resume_analysis"
  | "job_match"
  | "cover_letter"
  | "interview_prep"
  | "resume_improve"
  | "job_finder"
  | "auto_apply"
  | "smart_apply";

const FREE_LIMITS: Record<FeatureType, number> = {
  resume_analysis: 3,
  job_match: 3,
  cover_letter: 1,
  interview_prep: 0,
  resume_improve: 0, // Pro/Premium only
  job_finder: 1, // Free users get 1 search; Pro/Premium unlimited
  auto_apply: 2, // Free users get 2/month; Pro unlimited
  smart_apply: 0, // Pro/Premium only
};

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

/** Check if user can use the feature (under free limit or pro/premium). */
export async function canUseFeature(
  userId: string,
  feature: FeatureType,
  planType: "free" | "pro" | "premium"
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (planType === "pro" || planType === "premium") {
    return { allowed: true, used: 0, limit: -1 };
  }
  const used = await getUsageCount(userId, feature);
  const limit = FREE_LIMITS[feature];
  return {
    allowed: used < limit,
    used,
    limit,
  };
}

/** Log usage and return whether it was recorded. */
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
 * Uses a single DB query instead of 7 separate queries.
 */
export async function getUsageSummary(userId: string, planType: "free" | "pro" | "premium") {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Single query: fetch all feature usage rows for this month, count in JS
  const { data, error } = await supabase
    .from("usage_logs")
    .select("feature")
    .eq("user_id", userId)
    .gte("timestamp", startOfMonth.toISOString())
    .in("feature", ALL_FEATURES);

  const counts: Record<string, number> = {};
  if (!error && data) {
    for (const row of data) {
      counts[row.feature] = (counts[row.feature] || 0) + 1;
    }
  }

  const summary = {} as Record<FeatureType, { used: number; limit: number }>;
  for (const f of ALL_FEATURES) {
    const limit = planType === "pro" || planType === "premium" ? -1 : FREE_LIMITS[f];
    summary[f] = { used: counts[f] || 0, limit };
  }
  return summary;
}
