import { createClient } from "@/lib/supabase/server";

/**
 * Database-backed rate limiter that works in serverless environments.
 * Uses usage_logs table to count recent requests within a sliding window.
 * Falls back to allowing requests if the DB query fails (fail-open for availability).
 */
const WINDOW_MS = 60_000; // 1 minute window
const MAX_REQUESTS = 10; // max requests per window per user

export async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  try {
    const supabase = await createClient();
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

    const { count, error } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", "rate_limit")
      .gte("timestamp", windowStart);

    if (error) {
      // Fail open — allow request if DB query fails
      console.error("Rate limit check failed:", error.message);
      return { allowed: true, retryAfterMs: 0 };
    }

    const currentCount = count ?? 0;

    if (currentCount >= MAX_REQUESTS) {
      return { allowed: false, retryAfterMs: WINDOW_MS };
    }

    // Log this request for rate counting
    await supabase
      .from("usage_logs")
      .insert({ user_id: userId, feature: "rate_limit" });

    return { allowed: true, retryAfterMs: 0 };
  } catch {
    // Fail open on unexpected errors
    return { allowed: true, retryAfterMs: 0 };
  }
}
