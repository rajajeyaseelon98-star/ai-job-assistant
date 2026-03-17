import { createClient } from "@/lib/supabase/server";

type NotificationType = "info" | "success" | "warning" | "auto_apply" | "application" | "message";

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
