import type { User } from "@supabase/supabase-js";

/** Stable IDs so stubs and assertions can reference the same user. */
export const E2E_MOCK_RECRUITER_ID = "00000000-0000-4000-8000-000000000001";
export const E2E_MOCK_JOB_SEEKER_ID = "00000000-0000-4000-8000-000000000002";

const COOKIE_ROLE = "e2e-mock-role";
const COOKIE_SECRET = "e2e-mock-secret";

/**
 * Default shared secret for cookie `e2e-mock-secret` (Playwright + server).
 * Edge middleware cannot rely on `process.env.E2E_MOCK_AUTH_SECRET` being present at runtime,
 * so validation uses this literal when env is unset. Keep in sync with `e2e/e2e-mock-auth.ts`.
 */
export const E2E_MOCK_DEFAULT_SECRET = "playwright-e2e-mock-secret-v1";

type CookieGetter = { get(name: string): { value: string } | undefined };

/** True when mock cookies may be honored (never in production builds). */
export function isE2eMockAuthMiddlewareEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Validates Playwright mock cookies. Edge middleware cannot rely on arbitrary `process.env`
 * at runtime, so we gate on non-production and a fixed secret constant (see `E2E_MOCK_DEFAULT_SECRET`).
 */
export function readE2eMockRoleFromCookies(
  cookieStore: CookieGetter
): "recruiter" | "job_seeker" | null {
  if (process.env.NODE_ENV === "production") return null;
  const role = cookieStore.get(COOKIE_ROLE)?.value;
  const sent = cookieStore.get(COOKIE_SECRET)?.value;
  if (!sent || sent !== E2E_MOCK_DEFAULT_SECRET) return null;
  if (role === "recruiter" || role === "job_seeker") return role;
  return null;
}

export function buildSupabaseUserFromE2eRole(role: "recruiter" | "job_seeker"): User {
  const id = role === "recruiter" ? E2E_MOCK_RECRUITER_ID : E2E_MOCK_JOB_SEEKER_ID;
  const email = role === "recruiter" ? "e2e-recruiter@example.test" : "e2e-jobseeker@example.test";
  const now = new Date().toISOString();
  return {
    id,
    email,
    email_confirmed_at: now,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: now,
    updated_at: now,
  } as User;
}

type E2eUserProfile = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  plan_type: "free" | "pro" | "premium";
  role: "job_seeker" | "recruiter";
};

export function buildGetUserResultFromE2eRole(role: "recruiter" | "job_seeker"): {
  id: string;
  email: string;
  profile: E2eUserProfile;
} {
  const id = role === "recruiter" ? E2E_MOCK_RECRUITER_ID : E2E_MOCK_JOB_SEEKER_ID;
  const email = role === "recruiter" ? "e2e-recruiter@example.test" : "e2e-jobseeker@example.test";
  return {
    id,
    email,
    profile: {
      id,
      email,
      name: role === "recruiter" ? "E2E Recruiter" : "E2E Job Seeker",
      created_at: new Date().toISOString(),
      plan_type: "free",
      role,
    },
  };
}

export function isE2eMockUserId(id: string): boolean {
  return id === E2E_MOCK_RECRUITER_ID || id === E2E_MOCK_JOB_SEEKER_ID;
}

export function getE2eMockUserApiResponse(role: "recruiter" | "job_seeker") {
  const u = buildGetUserResultFromE2eRole(role);
  return {
    id: u.id,
    email: u.email,
    name: u.profile.name,
    plan_type: u.profile.plan_type,
    role: u.profile.role,
    last_active_role: u.profile.role,
    recruiter_onboarding_complete: role === "recruiter",
    headline: null as string | null,
    bio: null as string | null,
    avatar_url: null as string | null,
    profile_strength: role === "recruiter" ? 75 : 72,
    preferences: {
      experience_level: null as string | null,
      preferred_role: null as string | null,
      preferred_location: null as string | null,
      salary_expectation: null as string | null,
    },
  };
}
