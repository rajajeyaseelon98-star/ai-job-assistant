import { test, expect } from "@playwright/test";
import { asRole } from "./helpers/auth-context";

/**
 * Every inventory API route that is not covered by `inventory-get-smoke.api.spec.ts` GET probes:
 * minimal POST/PATCH/DELETE calls so each handler is exercised (invalid/empty payloads OK).
 *
 * Aligns with `docs/QA_ROUTE_INVENTORY.md`. Goal: **invoke** each route — not full behavioral contracts.
 */

const UUID = "00000000-0000-4000-8000-00000000aa01";

/** Handler responded without unexpected gateway/framework failure. */
const ALLOWED = new Set([
  200, 400, 401, 402, 403, 404, 405, 413, 415, 422, 429, 500,
]);

function assertAllowed(label: string, status: number) {
  expect(ALLOWED.has(status), `${label} unexpected HTTP ${status}`).toBeTruthy();
}

test.describe("Inventory POST smoke (job seeker)", () => {
  const cases: { path: string; body?: Record<string, unknown> }[] = [
    { path: "/api/analyze-resume", body: { resumeText: "" } },
    { path: "/api/applications", body: {} },
    { path: "/api/auto-apply", body: {} },
    { path: "/api/auto-jobs", body: {} },
    { path: `/api/auto-apply/${UUID}/confirm`, body: {} },
    { path: "/api/candidate-boost", body: {} },
    { path: "/api/feedback", body: {} },
    { path: "/api/generate-cover-letter", body: {} },
    { path: "/api/hiring-prediction", body: {} },
    { path: "/api/import-linkedin", body: {} },
    { path: "/api/improve-resume", body: {} },
    { path: "/api/interview-prep", body: {} },
    { path: "/api/job-match", body: {} },
    { path: `/api/jobs/${UUID}/apply`, body: {} },
    { path: "/api/messages", body: {} },
    { path: "/api/messages/mark-read", body: {} },
    { path: "/api/opportunity-alerts/scan", body: undefined },
    { path: "/api/share", body: {} },
    { path: "/api/share-result", body: {} },
    { path: "/api/smart-apply", body: {} },
    { path: "/api/smart-apply/trigger", body: {} },
    { path: "/api/streak", body: {} },
    { path: "/api/streak-rewards", body: {} },
    { path: "/api/upload-resume", body: {} },
    { path: "/api/user/delete-account", body: undefined },
    { path: "/api/user/avatar", body: {} },
    { path: "/api/improved-resumes/export-docx", body: {} },
    { path: "/api/messages/attachment", body: {} },
  ];

  for (const { path, body } of cases) {
    test(`POST ${path}`, async () => {
      const ctx = await asRole("job_seeker");
      const res =
        body === undefined
          ? await ctx.post(path)
          : await ctx.post(path, {
              data: body,
              headers: { "Content-Type": "application/json" },
            });
      assertAllowed(`job_seeker POST ${path}`, res.status());
      await ctx.dispose();
    });
  }
});

test.describe("Inventory POST smoke (recruiter)", () => {
  const cases: { path: string; body?: Record<string, unknown> }[] = [
    { path: "/api/recruiter/jobs", body: {} },
    { path: `/api/recruiter/jobs/${UUID}/optimize`, body: {} },
    { path: `/api/recruiter/jobs/${UUID}/auto-shortlist`, body: {} },
    { path: "/api/recruiter/jobs/generate-description", body: {} },
    { path: "/api/recruiter/instant-shortlist", body: {} },
    { path: "/api/recruiter/skill-gap", body: {} },
    { path: "/api/recruiter/salary-estimate", body: {} },
    { path: "/api/recruiter/templates", body: {} },
    { path: "/api/recruiter/alerts", body: {} },
    { path: "/api/recruiter/push", body: {} },
    { path: `/api/recruiter/resumes/${UUID}/analyze`, body: {} },
    { path: `/api/recruiter/applications/${UUID}/interview`, body: {} },
    { path: `/api/recruiter/applications/${UUID}/screen`, body: {} },
    { path: "/api/recruiter/company", body: {} },
    { path: "/api/recruiter/company/invites", body: {} },
    { path: "/api/recruiter/company/invites/accept", body: {} },
    { path: `/api/recruiter/company/${UUID}/logo`, body: {} },
  ];

  for (const { path, body } of cases) {
    test(`POST ${path}`, async () => {
      const ctx = await asRole("recruiter");
      const res = await ctx.post(path, {
        data: body ?? {},
        headers: { "Content-Type": "application/json" },
      });
      assertAllowed(`recruiter POST ${path}`, res.status());
      await ctx.dispose();
    });
  }
});

test.describe("Inventory POST smoke (unauthenticated / public)", () => {
  const cases = [
    { path: "/api/public/extract-resume", body: {} },
    { path: "/api/public/fresher-resume", body: {} },
    { path: "/api/webhooks/resend", body: {} },
    { path: "/api/internal/e2e-password-login", body: {} },
  ];

  for (const { path, body } of cases) {
    test(`POST ${path}`, async ({ request }) => {
      const res = await request.post(path, {
        data: body,
        headers: { "Content-Type": "application/json" },
      });
      assertAllowed(`public POST ${path}`, res.status());
    });
  }
});

test.describe("Inventory POST smoke (internal email-retry)", () => {
  test("POST /api/internal/email-retry", async ({ request }) => {
    const res = await request.post("/api/internal/email-retry", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    assertAllowed("POST /api/internal/email-retry", res.status());
  });
});

test.describe("Inventory PATCH smoke (job seeker)", () => {
  const paths = [
    "/api/applications/" + UUID,
    "/api/auto-apply/" + UUID,
    "/api/cover-letters/" + UUID,
    "/api/daily-actions",
    "/api/dev/plan",
    "/api/notifications",
    "/api/opportunity-alerts",
    "/api/profile",
    "/api/smart-apply",
    "/api/user",
    "/api/user/role",
  ];

  for (const path of paths) {
    test(`PATCH ${path}`, async () => {
      const ctx = await asRole("job_seeker");
      const res = await ctx.patch(path, {
        data: {},
        headers: { "Content-Type": "application/json" },
      });
      assertAllowed(`job_seeker PATCH ${path}`, res.status());
      await ctx.dispose();
    });
  }
});

test.describe("Inventory PATCH smoke (recruiter)", () => {
  const paths = [
    `/api/recruiter/applications/${UUID}`,
    `/api/recruiter/applications/${UUID}/interview`,
    `/api/recruiter/company/${UUID}`,
    `/api/recruiter/entitlements`,
    `/api/recruiter/jobs/${UUID}`,
    `/api/recruiter/alerts/${UUID}`,
    `/api/recruiter/templates/${UUID}`,
  ];

  for (const path of paths) {
    test(`PATCH ${path}`, async () => {
      const ctx = await asRole("recruiter");
      const res = await ctx.patch(path, {
        data: {},
        headers: { "Content-Type": "application/json" },
      });
      assertAllowed(`recruiter PATCH ${path}`, res.status());
      await ctx.dispose();
    });
  }
});

test.describe("Inventory DELETE smoke", () => {
  test("job seeker DELETE /api/user/avatar", async () => {
    const ctx = await asRole("job_seeker");
    const res = await ctx.delete("/api/user/avatar");
    assertAllowed("DELETE /api/user/avatar", res.status());
    await ctx.dispose();
  });

  const recruiterDeletes = [
    `/api/recruiter/templates/${UUID}`,
    `/api/recruiter/alerts/${UUID}`,
    `/api/recruiter/jobs/${UUID}`,
    `/api/recruiter/company/${UUID}`,
    `/api/recruiter/applications/${UUID}`,
    `/api/recruiter/applications/${UUID}/interview`,
    `/api/recruiter/company/${UUID}/logo`,
  ];

  for (const path of recruiterDeletes) {
    test(`recruiter DELETE ${path}`, async () => {
      const ctx = await asRole("recruiter");
      const res = await ctx.delete(path);
      assertAllowed(`recruiter DELETE ${path}`, res.status());
      await ctx.dispose();
    });
  }

  test("job seeker DELETE /api/applications/" + UUID, async () => {
    const ctx = await asRole("job_seeker");
    const res = await ctx.delete(`/api/applications/${UUID}`);
    assertAllowed("DELETE /api/applications/:id", res.status());
    await ctx.dispose();
  });

  test("job seeker DELETE /api/cover-letters/" + UUID, async () => {
    const ctx = await asRole("job_seeker");
    const res = await ctx.delete(`/api/cover-letters/${UUID}`);
    assertAllowed("DELETE /api/cover-letters/:id", res.status());
    await ctx.dispose();
  });
});
