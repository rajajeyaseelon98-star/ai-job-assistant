/**
 * Recipient search rate limit (GET /api/messages/recipient-search).
 * Tune via env without code changes; monitor logs for `recipient_search_rate_limited`.
 */
function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  const n = parseInt(value ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, n);
}

const WINDOW_MS = 60_000;

export function getRecipientSearchRateLimitConfig(): {
  windowMs: number;
  max: number;
} {
  return {
    windowMs: WINDOW_MS,
    max: parsePositiveInt(
      process.env.RECIPIENT_SEARCH_RATE_LIMIT_MAX,
      45,
      500
    ),
  };
}
