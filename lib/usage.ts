import { createClient } from "./supabase/server";

export type FeatureType =
  | "resume_analysis"
  | "job_match"
  | "cover_letter"
  | "interview_prep";

const FREE_LIMITS: Record<FeatureType, number> = {
  resume_analysis: 3,
  job_match: 3,
  cover_letter: 1,
  interview_prep: 0,
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

/** Get usage summary for dashboard (current month). */
export async function getUsageSummary(userId: string, planType: "free" | "pro" | "premium") {
  const features: FeatureType[] = [
    "resume_analysis",
    "job_match",
    "cover_letter",
    "interview_prep",
  ];
  const summary: Record<FeatureType, { used: number; limit: number }> = {} as any;
  for (const f of features) {
    const used = await getUsageCount(userId, f);
    const limit = planType === "pro" || planType === "premium" ? -1 : FREE_LIMITS[f];
    summary[f] = { used, limit };
  }
  return summary;
}
