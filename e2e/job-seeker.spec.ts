import { test, expect } from "@playwright/test";
import { E2E_MOCK_JOB_SEEKER_ID, E2E_MOCK_RECRUITER_ID } from "../lib/e2e-auth";
import { applyE2eMockAuth } from "./e2e-mock-auth";

/**
 * Job seeker flows use cookie-based mock auth (`lib/e2e-auth.ts`) when the dev server
 * uses mock cookies + `next dev` (non-production).
 */
test.describe("Job seeker smoke", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await applyE2eMockAuth(context, "job_seeker");
    await page.goto("/");
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
    });
  });

  test("mock session lands on dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    expect(new URL(page.url()).pathname).toBe("/dashboard");
  });

  test("/select-role shows role choice", async ({ page }) => {
    await page.goto("/select-role");
    await page.waitForURL(/\/select-role/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Choose Your Role" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Job Seeker/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Recruiter/i })).toBeVisible();
  });

  test("job seeker dashboard loads", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  });

  test("job seeker job board loads", async ({ page }) => {
    await page.goto("/job-board", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Job Board" })).toBeVisible();
    await expect(page.getByPlaceholder("Search job titles...")).toBeVisible();
  });

  test("job seeker resume analyzer loads", async ({ page }) => {
    await page.goto("/resume-analyzer", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Resume Analyzer" })).toBeVisible();
    await expect(page.getByText(/ATS-style feedback/i)).toBeVisible();
  });

  test("job seeker application tracker loads", async ({ page }) => {
    await page.goto("/applications", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Application Tracker" })).toBeVisible();
  });

  test("job seeker messages inbox loads", async ({ page }) => {
    await page.route(
      (url) => {
        const u = url instanceof URL ? url : new URL(url);
        return u.pathname.replace(/\/$/, "") === "/api/messages";
      },
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            messages: [],
            peer_profiles: {},
            has_more: false,
            next_before: null,
            partial: true,
          }),
        });
      }
    );
    await page.route("**/api/messages/unread-summary**", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ counts: {} }),
      });
    });

    await page.goto("/messages", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
    await expect(page.getByText("Select a conversation")).toBeVisible();
  });

  test("job seeker messages compose URL prefills receiver_id", async ({ page }) => {
    await page.route(
      (url) => {
        const u = url instanceof URL ? url : new URL(url);
        return u.pathname.replace(/\/$/, "") === "/api/messages";
      },
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            messages: [],
            peer_profiles: {},
            has_more: false,
            next_before: null,
            partial: true,
          }),
        });
      }
    );
    await page.route("**/api/messages/unread-summary**", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ counts: {} }),
      });
    });

    const q = new URLSearchParams({
      compose: "1",
      receiver_id: E2E_MOCK_RECRUITER_ID,
    });
    await page.goto(`/messages?${q.toString()}`, { waitUntil: "domcontentloaded" });

    await expect(page.getByText("New Message")).toBeVisible();
    await expect(page.getByText(new RegExp(E2E_MOCK_RECRUITER_ID.slice(-8)))).toBeVisible();
  });

  test("job seeker messages peer query opens thread (stubbed list + mark-read)", async ({ page }) => {
    const stubMessage = {
      id: "msg-e2e-js-1",
      sender_id: E2E_MOCK_RECRUITER_ID,
      receiver_id: E2E_MOCK_JOB_SEEKER_ID,
      job_id: null,
      subject: "Hello",
      content: "Hi from recruiter (stub)",
      is_read: false,
      read_at: null,
      template_name: null,
      created_at: new Date().toISOString(),
    };

    await page.route(
      (url) => {
        const u = url instanceof URL ? url : new URL(url);
        return u.pathname.replace(/\/$/, "") === "/api/messages";
      },
      async (route) => {
        if (route.request().method() !== "GET") return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            messages: [stubMessage],
            peer_profiles: {
              [E2E_MOCK_RECRUITER_ID]: { name: "E2E Recruiter", avatar_url: null },
            },
            has_more: false,
            next_before: null,
            partial: true,
          }),
        });
      }
    );

    await page.route(
      (url) => {
        const u = url instanceof URL ? url : new URL(url);
        return u.pathname.replace(/\/$/, "") === "/api/messages/mark-read";
      },
      async (route) => {
        if (route.request().method() !== "POST") return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      }
    );

    await page.route("**/api/messages/thread**", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          messages: [stubMessage],
          peer_profiles: {
            [E2E_MOCK_RECRUITER_ID]: { name: "E2E Recruiter", avatar_url: null },
          },
          has_more: false,
          next_before: null,
          peer_id: E2E_MOCK_RECRUITER_ID,
        }),
      });
    });
    await page.route("**/api/messages/unread-summary**", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ counts: { [E2E_MOCK_RECRUITER_ID]: 1 } }),
      });
    });

    await page.goto(
      `/messages?peer=${encodeURIComponent(E2E_MOCK_RECRUITER_ID)}`,
      { waitUntil: "domcontentloaded" }
    );

    await expect(page.getByText("Conversation")).toBeVisible();
    await expect(page.getByText("E2E Recruiter")).toBeVisible();
    await expect(
      page.locator("main p.whitespace-pre-wrap").filter({ hasText: "Hi from recruiter (stub)" })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Reply…")).toBeVisible();
  });

  test("job seeker resume analyzer input mode + Improve my resume button (analysisId)", async ({
    page,
  }) => {
    // Must be a valid UUID shape or the real API returns 400 before our stub matters.
    const analysisId = "00000000-0000-4000-8000-0000000000a1";

    await page.route(`**/api/resume-analysis/${analysisId}`, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: analysisId,
          score: 72,
          analysis_json: {
            atsScore: 72,
            missingSkills: ["Communication"],
            resumeImprovements: ["Rewrite summary for impact"],
            recommendedRoles: ["Frontend Engineer"],
          },
          resume_text: "John Doe resume text (stubbed)",
          resume_id: "00000000-0000-4000-8000-0000000000a2",
          created_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`/resume-analyzer?analysisId=${analysisId}`);

    await expect(page.getByRole("heading", { name: "Resume Analyzer" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Input method" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload PDF / DOCX" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Paste resume text" })).toBeVisible();

    await expect(page.getByText("Tailor & Improve with AI")).toBeVisible();
    await expect(page.getByRole("button", { name: "Improve my resume" })).toBeVisible();
  });

  test("job seeker job board apply modal rendering (stubbed APIs)", async ({ page }) => {
    const jobId = "job-qa-1";
    const jobTitle = "QA Engineer (Stubbed)";

    const listPayload = JSON.stringify({
      jobs: [
        {
          id: jobId,
          title: jobTitle,
          description: "Job description (stubbed).",
          requirements: "Requirements (stubbed).",
          skills_required: ["QA", "Playwright", "TypeScript"],
          experience_min: 2,
          experience_max: 5,
          salary_min: 100000,
          salary_max: 180000,
          salary_currency: "INR",
          location: "Remote",
          work_type: "remote",
          employment_type: "full_time",
          application_count: 0,
          created_at: new Date().toISOString(),
          companies: { id: "c-1", name: "Stub Corp", logo_url: null, industry: null, location: null },
        },
      ],
      total: 1,
      totalPages: 1,
      page: 1,
      limit: 20,
    });

    // Match `/api/jobs` only (not `/api/jobs/applied` or `/api/jobs/:id/...`).
    await page.route(/\/api\/jobs(\?|$)/, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: listPayload,
      });
    });

    await page.route(/\/api\/jobs\/applied(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });

    await page.route(/\/api\/upload-resume(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });

    await page.route(
      (url) => {
        const u = url instanceof URL ? url : new URL(url);
        return u.pathname.replace(/\/$/, "") === `/api/jobs/${jobId}/apply`;
      },
      async (route, request) => {
        if (request.method() !== "POST") return route.fallback();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      }
    );

    await page.goto("/job-board");
    await expect(page.getByRole("heading", { name: "Job Board" })).toBeVisible();

    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            const r = await fetch("/api/jobs?page=1&limit=20");
            if (!r.ok) return -1;
            const j = (await r.json()) as { jobs?: unknown[] };
            return j.jobs?.length ?? 0;
          }),
        { timeout: 30_000 }
      )
      .toBe(1);

    await page.getByRole("button", { name: jobTitle }).click();

    await expect(page.getByRole("button", { name: "Apply Now" })).toBeVisible();
    await page.getByRole("button", { name: "Apply Now" }).click();

    await expect(page.getByText("Submit your application")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Application" })).toBeVisible();

    await page.getByRole("button", { name: "Submit Application" }).click();
    await expect(page.getByRole("button", { name: "Apply Now" })).toBeVisible();
  });
});
