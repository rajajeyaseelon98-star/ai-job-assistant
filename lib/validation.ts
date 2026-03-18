/** Validate that a string looks like a UUID v4. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_RE.test(id);
}

/**
 * Sanitize a redirect path to prevent open redirect attacks.
 * Must start with / (relative path only), must not contain:
 * - // (protocol-relative URL)
 * - :// (absolute URL)
 * - \ (backslash — some browsers normalize /\evil.com as //evil.com)
 * - javascript: or data: schemes
 */
export function sanitizeRedirectPath(path: string | null, fallback = "/dashboard"): string {
  if (!path || typeof path !== "string") return fallback;
  const trimmed = path.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("://") ||
    trimmed.includes("\\") ||
    trimmed.toLowerCase().includes("javascript:") ||
    trimmed.toLowerCase().includes("data:")
  ) {
    return fallback;
  }
  return trimmed;
}

/** Escape HTML special characters to prevent XSS. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate and constrain text input length.
 * Returns trimmed text or null if it exceeds maxBytes (prevents memory exhaustion on large payloads).
 */
export function validateTextLength(
  text: string | undefined | null,
  maxLength: number,
  fieldName = "text"
): { valid: boolean; text: string; error?: string } {
  if (!text || typeof text !== "string") {
    return { valid: false, text: "", error: `${fieldName} is required` };
  }
  // Hard limit: reject inputs longer than maxLength (prevents memory attacks)
  if (text.length > maxLength) {
    return {
      valid: false,
      text: "",
      error: `${fieldName} exceeds maximum length of ${maxLength} characters`,
    };
  }
  return { valid: true, text: text.trim() };
}

/** Validate that an action_type is in the known allowlist. */
const VALID_ACTION_TYPES = new Set([
  "apply",
  "resume_analyze",
  "resume_improve",
  "job_match",
  "cover_letter",
  "interview_prep",
  "daily_login",
  "streak_bonus",
]);

export function isValidActionType(actionType: string): boolean {
  return VALID_ACTION_TYPES.has(actionType);
}
