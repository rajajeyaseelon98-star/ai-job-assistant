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
): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[notifications] createNotificationForUser skipped: set SUPABASE_SERVICE_ROLE_KEY so recipients get in-app alerts (e.g. new messages)."
      );
    }
    return;
  }
  try {
    await admin.from("notifications").insert({
      user_id: targetUserId,
      type,
      title,
      message,
      data: data || {},
    });
  } catch {
    // Non-critical — silently ignore
  }
}
