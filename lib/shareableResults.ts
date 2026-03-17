import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export interface ShareableResult {
  token: string;
  type: "ats_score" | "interview_probability" | "hiring_benchmark";
  data: Record<string, unknown>;
  user_name: string | null;
  created_at: string;
}

/**
 * Generate a shareable token for any result type.
 * Stores in notifications data field for retrieval.
 */
export async function createShareableResult(
  userId: string,
  type: ShareableResult["type"],
  data: Record<string, unknown>
): Promise<string> {
  const supabase = await createClient();
  const token = crypto.randomBytes(16).toString("hex");

  // Get user name for display
  const { data: user } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .single();

  // Store as a notification with special type
  await supabase.from("notifications").insert({
    user_id: userId,
    type: "info",
    title: `Shareable ${type.replace("_", " ")}`,
    message: `Shared via token: ${token}`,
    data: {
      share_token: token,
      share_type: type,
      share_data: data,
      user_name: user?.name || "Anonymous",
    },
    read: true,
  });

  return token;
}

/**
 * Retrieve a shared result by token.
 */
export async function getSharedResult(token: string): Promise<ShareableResult | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("data, created_at")
    .contains("data", { share_token: token })
    .single();

  if (!data || !data.data) return null;

  const d = data.data as Record<string, unknown>;
  return {
    token,
    type: d.share_type as ShareableResult["type"],
    data: d.share_data as Record<string, unknown>,
    user_name: (d.user_name as string) || null,
    created_at: data.created_at,
  };
}
