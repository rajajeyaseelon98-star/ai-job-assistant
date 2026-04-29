import { createClient } from "@/lib/supabase/server";
import { getRecipientSearchRateLimitConfig } from "@/lib/rate-limit-config";

/**
 * Database-backed rate limiter that works in serverless environments.
 * Uses usage_logs table to count recent requests within a sliding window.
 * Falls back to allowing requests if the DB query fails (fail-open for availability).
 */
const WINDOW_MS = 60_000; // 1 minute window
// Dev/testing can easily exceed the default due to retries + rapid iteration.
const MAX_REQUESTS = process.env.NODE_ENV === "production" ? 10 : 200; // max requests per window per user

type RateLimitConfig = {
  windowMs: number;
  max: number;
  /** Must match usage_logs.feature CHECK (see migrations). */
  feature: string;
};

async function checkRateLimitWithConfig(
  userId: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  try {
    const supabase = await createClient();
    const windowStart = new Date(Date.now() - config.windowMs).toISOString();

    const { count, error } = await supabase
      .from("usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", config.feature)
      .gte("timestamp", windowStart);

    if (error) {
      console.error("Rate limit check failed:", error.message);
      return { allowed: true, retryAfterMs: 0 };
    }

    const currentCount = count ?? 0;

    if (currentCount >= config.max) {
      return { allowed: false, retryAfterMs: config.windowMs };
    }

    await supabase.from("usage_logs").insert({ user_id: userId, feature: config.feature });

    return { allowed: true, retryAfterMs: 0 };
  } catch {
    return { allowed: true, retryAfterMs: 0 };
  }
}

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  retryAfterMs: number;
}> {
  return checkRateLimitWithConfig(userId, {
    windowMs: WINDOW_MS,
    max: MAX_REQUESTS,
    feature: "rate_limit",
  });
}

/** Separate bucket for GET /api/messages/recipient-search (debounced typing still issues many requests). */
export async function checkRecipientSearchRateLimit(userId: string): Promise<{
  allowed: boolean;
  retryAfterMs: number;
}> {
  const cfg = getRecipientSearchRateLimitConfig();
  return checkRateLimitWithConfig(userId, {
    windowMs: cfg.windowMs,
    max: cfg.max,
    feature: "message_recipient_search",
  });
}
