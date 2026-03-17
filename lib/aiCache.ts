import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

// TTL per feature in milliseconds
const CACHE_TTL: Record<string, number> = {
  resume_analysis: 7 * 24 * 60 * 60 * 1000, // 7 days
  resume_improve: 7 * 24 * 60 * 60 * 1000,
  job_match: 1 * 24 * 60 * 60 * 1000, // 1 day
  job_finder: 1 * 24 * 60 * 60 * 1000,
  skill_extraction: 7 * 24 * 60 * 60 * 1000,
};

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 1 day

/**
 * Generate a deterministic cache key from input content.
 * Hashes the full content (normalized) to avoid collisions from truncation.
 */
export function generateCacheKey(feature: string, content: string): string {
  const normalized = content.trim().toLowerCase().replace(/\s+/g, " ");
  return crypto
    .createHash("sha256")
    .update(`${feature}:${normalized}`)
    .digest("hex");
}

/**
 * Get a cached AI response if it exists and hasn't expired.
 */
export async function getCachedResponse(hash: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("ai_cache")
      .select("response")
      .eq("hash", hash)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (data?.response) {
      return typeof data.response === "string"
        ? data.response
        : JSON.stringify(data.response);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Store an AI response in cache with feature-specific TTL.
 */
export async function setCachedResponse(
  hash: string,
  response: string,
  feature: string
): Promise<void> {
  try {
    const ttl = CACHE_TTL[feature] || DEFAULT_TTL;
    const expiresAt = new Date(Date.now() + ttl).toISOString();

    // Try parsing as JSON for efficient JSONB storage
    let responseValue: unknown;
    try {
      responseValue = JSON.parse(response);
    } catch {
      responseValue = response;
    }

    const supabase = await createClient();
    await supabase.from("ai_cache").upsert({
      hash,
      response: responseValue,
      feature,
      expires_at: expiresAt,
    });
  } catch {
    // Cache write failure is non-critical — silently ignore
  }
}
