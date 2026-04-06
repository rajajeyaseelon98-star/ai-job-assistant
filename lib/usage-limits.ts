/**
 * Free-plan monthly limits and feature keys — safe to import from Client Components.
 * Server usage enforcement lives in `lib/usage.ts`.
 */
export type FeatureType =
  | "resume_analysis"
  | "job_match"
  | "cover_letter"
  | "interview_prep"
  | "resume_improve"
  | "job_finder"
  | "auto_apply"
  | "smart_apply";

export const FREE_PLAN_LIMITS: Record<FeatureType, number> = {
  resume_analysis: 3,
  job_match: 3,
  cover_letter: 1,
  interview_prep: 0,
  resume_improve: 0,
  job_finder: 1,
  auto_apply: 2,
  smart_apply: 0,
};
