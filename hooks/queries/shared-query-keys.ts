/**
 * Shared TanStack keys used by multiple feature hooks (avoid drift between modules).
 */
export const sharedQueryKeys = {
  /** Resume list from GET /api/upload-resume — used by job board + smart apply. */
  resumes: () => ["shared", "resumes"] as const,
};
