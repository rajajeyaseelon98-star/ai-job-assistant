import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type NotificationType = "info" | "success" | "warning" | "auto_apply" | "application" | "message";

/** Inserts a notification for the signed-in user (RLS allows `auth.uid() = user_id`). */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      data: data || {},
    });
  } catch {
    // Non-critical — silently ignore
  }
}

/**
 * Inserts a notification for another user (e.g. message recipient). RLS blocks anon inserts
 * for `user_id !== auth.uid()`, so this uses the service role when `SUPABASE_SERVICE_ROLE_KEY` is set.
 */
export async function createNotificationForUser(
  targetUserId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  const admin = createServiceRoleClient();
  if (!admin) {
    // Stable prefix for log alerts — delivery is skipped without service role (RLS blocks cross-user inserts).
    console.warn(
      `[notifications] notification_delivery_skipped reason=no_service_role_client targetUserId=${targetUserId} type=${type}`
    );
    return false;
  }
  try {
    const { error } = await admin.from("notifications").insert({
      user_id: targetUserId,
      type,
      title,
      message,
      data: data || {},
    });
    if (error) {
      console.warn("[notifications] notification_insert_failed", {
        targetUserId,
        type,
        error: error.message,
      });
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[notifications] notification_insert_failed", {
      targetUserId,
      type,
      error: e instanceof Error ? e.message : String(e),
    });
    return false;
  }
}
