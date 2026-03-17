import { createClient } from "@/lib/supabase/server";

export type ActivityType =
  | "application_submitted"
  | "interview_scheduled"
  | "offer_received"
  | "resume_improved"
  | "skill_added"
  | "profile_updated"
  | "milestone"
  | "auto_apply_completed"
  | "score_improved";

export interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  is_public: boolean;
  created_at: string;
}

/**
 * Log an activity event for a user. Non-blocking by design.
 */
export async function logActivity(
  userId: string,
  activityType: ActivityType,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>,
  isPublic = false
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("activity_feed").insert({
      user_id: userId,
      activity_type: activityType,
      title,
      description: description || null,
      metadata: metadata || {},
      is_public: isPublic,
    });
  } catch {
    // Non-critical — silently ignore
  }
}

/**
 * Get a user's own activity feed.
 */
export async function getUserActivityFeed(
  userId: string,
  limit = 20,
  offset = 0
): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_feed")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data || []) as ActivityItem[];
}

/**
 * Get public activity feed (social proof - anonymized).
 */
export async function getPublicActivityFeed(limit = 20): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_feed")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as ActivityItem[];
}

/**
 * Auto-detect milestones and log them.
 */
export async function checkAndLogMilestones(userId: string): Promise<void> {
  const supabase = await createClient();

  // Count total applications
  const { count: appCount } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const milestones = [10, 25, 50, 100, 250, 500];
  const total = appCount || 0;

  for (const milestone of milestones) {
    if (total >= milestone) {
      // Check if this milestone was already logged
      const { count: existing } = await supabase
        .from("activity_feed")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("activity_type", "milestone")
        .contains("metadata", { milestone_type: "applications", count: milestone });

      if (!existing || existing === 0) {
        await logActivity(
          userId,
          "milestone",
          `Applied to ${milestone} jobs!`,
          `Reached the ${milestone} applications milestone.`,
          { milestone_type: "applications", count: milestone },
          true // Public milestone
        );
      }
    }
  }
}
