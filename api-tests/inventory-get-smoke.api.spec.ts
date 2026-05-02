import { test, expect } from "@playwright/test";
import { asRole } from "./helpers/auth-context";
import { E2E_MOCK_RECRUITER_ID } from "../lib/e2e-auth";

/**
 * Broad GET smoke against `docs/QA_ROUTE_INVENTORY.md`: verifies each route handler
 * responds without crashing (JSON where applicable). Does **not** assert business outcomes —
 * Supabase/env may yield 404/500 in CI without seed data.
 *
 * For “100% API behavior”, add focused contract tests per route (see `contracts.api.spec.ts`).
 */

const UUID = "00000000-0000-4000-8000-00000000aa01";

/** `/api/jobs` is protected by middleware (session required); list it under mock-auth job seeker, not here. */
const PUBLIC_GET_PATHS = ["/api/platform-stats"];

const JOB_SEEKER_GET_PATHS = [
  "/api/activity-feed",
  "/api/applications",
  "/api/auto-apply",
  "/api/auto-jobs/history",
  "/api/jobs",
  "/api/candidate-boost",
  "/api/career-coach",
  "/api/competition",
  "/api/cover-letters",
  "/api/daily-actions",
  "/api/daily-report",
  "/api/dashboard",
  "/api/history",
  "/api/improved-resumes",
  "/api/insights",
  "/api/job-applications",
  "/api/jobs/applied",
  "/api/messages/recipient-search?q=ab",
  `/api/messages/thread?peer_id=${E2E_MOCK_RECRUITER_ID}`,
  "/api/messages/unread-summary",
  "/api/notifications",
  "/api/opportunity-alerts",
  "/api/profile",
  "/api/resume-performance",
  "/api/salary-intelligence",
  "/api/skill-demand",
  "/api/smart-apply",
  "/api/streak",
  "/api/streak-rewards",
  "/api/upload-resume",
  "/api/usage",
  "/api/usage/feature-breakdown",
  "/api/usage/history",
  "/api/usage/summary",
  "/api/user",
  `/api/applications/${UUID}`,
  `/api/auto-apply/${UUID}`,
  `/api/cover-letters/${UUID}`,
  `/api/improved-resumes/${UUID}`,
  `/api/improved-resumes/${UUID}/download`,
  `/api/job-matches/${UUID}`,
  `/api/jobs/${UUID}`,
  `/api/resume-analysis/${UUID}`,
  `/api/resume-file/${UUID}`,
  `/api/share-result?token=${UUID}`,
];

const RECRUITER_GET_PATHS = [
  "/api/recruiter/alerts",
  "/api/recruiter/applications",
  "/api/recruiter/candidates",
  "/api/recruiter/company",
  "/api/recruiter/entitlements",
  "/api/recruiter/intelligence",
  "/api/recruiter/jobs",
  "/api/recruiter/messages",
  "/api/recruiter/templates",
  "/api/recruiter/top-candidates",
  `/api/recruiter/applications/${UUID}`,
  `/api/recruiter/candidates/${UUID}`,
  `/api/recruiter/candidates/${UUID}/similar`,
  `/api/recruiter/company/${UUID}`,
  `/api/recruiter/jobs/${UUID}`,
  `/api/recruiter/templates/${UUID}`,
  `/api/recruiter/resumes/${UUID}/download`,
];

async function expectJsonCapableResponse(
  label: string,
  getFn: () => Promise<{ status(): number; headers(): Record<string, string>; json(): Promise<unknown>; text(): Promise<string> }>
) {
  const res = await getFn();
  const status = res.status();
  expect(
    [200, 400, 403, 404, 429, 500],
    `${label} returned unexpected HTTP ${status}`
  ).toContain(status);

  const ct = res.headers()["content-type"] ?? "";
  if (status !== 204 && ct.includes("application/json")) {
    const body = await res.json();
    expect(body).toEqual(expect.anything());
  }
}

test.describe("Inventory GET smoke (job seeker)", () => {
  for (const path of JOB_SEEKER_GET_PATHS) {
    test(`GET ${path}`, async () => {
      const ctx = await asRole("job_seeker");
      await expectJsonCapableResponse(`job_seeker GET ${path}`, () => ctx.get(path));
      await ctx.dispose();
    });
  }
});

test.describe("Inventory GET smoke (recruiter)", () => {
  for (const path of RECRUITER_GET_PATHS) {
    test(`GET ${path}`, async () => {
      const ctx = await asRole("recruiter");
      await expectJsonCapableResponse(`recruiter GET ${path}`, () => ctx.get(path));
      await ctx.dispose();
    });
  }
});

test.describe("Inventory GET smoke (public)", () => {
  for (const path of PUBLIC_GET_PATHS) {
    test(`GET ${path} (no mock cookie)`, async ({ request }) => {
      await expectJsonCapableResponse(`public GET ${path}`, () => request.get(path));
    });
  }
});
