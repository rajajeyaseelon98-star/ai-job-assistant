import { test, expect } from "@playwright/test";
import { applyE2eMockAuth } from "./e2e-mock-auth";

/**
 * Recruiter flows use cookie-based mock auth (`lib/e2e-auth.ts`) when the dev server
 * uses mock cookies + `next dev` (non-production).
 */
test.describe("Recruiter smoke", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await applyE2eMockAuth(context, "recruiter");
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

  test("mock session lands on /recruiter", async ({ page }) => {
    await page.goto("/recruiter");
    await page.waitForURL(/\/recruiter/, { timeout: 30_000 });
    expect(new URL(page.url()).pathname).toBe("/recruiter");
  });

  test("recruiter home shows dashboard heading", async ({ page }) => {
    await page.goto("/recruiter");
    await expect(page.getByRole("heading", { name: "Recruiter Dashboard" })).toBeVisible();
  });

  test("recruiter jobs list loads", async ({ page }) => {
    await page.goto("/recruiter/jobs");
    await expect(page.getByRole("heading", { name: "Job Postings" })).toBeVisible();
    await expect(page.getByRole("link", { name: "New Job" })).toBeVisible();
  });

  test("recruiter can open post job form", async ({ page }) => {
    await page.goto("/recruiter/jobs/new");
    await expect(page.getByRole("heading", { name: "Post New Job" })).toBeVisible();
    await expect(page.getByPlaceholder("e.g., Senior React Developer")).toBeVisible();
    await expect(page.getByRole("button", { name: "AI Generate" })).toBeVisible();
  });

  test("recruiter analytics loads", async ({ page }) => {
    await page.route(/\/api\/recruiter\/jobs(\?|$)/, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "job-analytics-1",
            title: "Analytics Stub Job",
            status: "active",
            application_count: 4,
          },
        ]),
      });
    });

    await page.route(/\/api\/recruiter\/applications(\?|$)/, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "app-1", stage: "applied", match_score: 82 },
          { id: "app-2", stage: "interview", match_score: 74 },
        ]),
      });
    });

    await page.goto("/recruiter/analytics");
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Pipeline Breakdown")).toBeVisible();
  });

  test("recruiter candidate search loads", async ({ page }) => {
    await page.goto("/recruiter/candidates");
    await expect(page.getByRole("heading", { name: "Candidate Search" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply filters" })).toBeVisible();
  });

  test("recruiter messages loads", async ({ page }) => {
    await page.goto("/recruiter/messages");
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
  });

  test("recruiter job detail loads via job postings click-through", async ({ page }) => {
    const jobId = "job-1";
    const jobTitle = "Senior React Developer";

    await page.route("**/api/recruiter/jobs", async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      const path = new URL(route.request().url()).pathname;
      if (path !== "/api/recruiter/jobs") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: jobId,
            title: jobTitle,
            location: "Bengaluru",
            work_type: "remote",
            employment_type: "full_time",
            status: "active",
            application_count: 3,
            salary_min: 100000,
            salary_max: 200000,
            salary_currency: "INR",
            requirements: "React + TypeScript",
            skills_required: ["React", "TypeScript", "Next.js"],
          },
        ]),
      });
    });

    await page.route(`**/api/recruiter/jobs/${jobId}`, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: jobId,
          title: jobTitle,
          location: "Bengaluru",
          work_type: "remote",
          employment_type: "full_time",
          status: "active",
          application_count: 3,
          salary_min: 100000,
          salary_max: 200000,
          salary_currency: "INR",
          requirements: "React + TypeScript",
          skills_required: ["React", "TypeScript", "Next.js"],
          description: "Responsibilities and details...",
        }),
      });
    });

    await page.goto("/recruiter/jobs");

    await page.getByRole("link", { name: jobTitle }).click();
    await page.waitForURL(new RegExp(`/recruiter/jobs/${jobId}`), { timeout: 30_000 });

    await expect(page.getByRole("heading", { name: "Edit Job Posting" })).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /e\.g\., Senior React Developer/i })
    ).toBeVisible();
  });

  test("recruiter candidate search renders results and similar-candidates API works", async ({
    page,
  }) => {
    const candidateId = "00000000-0000-4000-8000-00000000c001";
    const candidateName = "Alice Jobseeker";

    const candidatesListPayload = {
      candidates: [
        {
          id: candidateId,
          email: "alice@example.com",
          name: candidateName,
          resume_id: "00000000-0000-4000-8000-00000000r001",
          resume_preview: "React developer with Next.js experience",
          has_resume: true,
          experience_level: "mid",
          preferred_role: "Frontend Engineer",
          preferred_location: "Remote",
          salary_expectation: "INR 150000",
          created_at: new Date().toISOString(),
        },
      ],
      page: 1,
      pageSize: 25,
      total: 1,
      totalPages: 1,
      truncated: false,
    };

    await page.route(/\/api\/recruiter\/candidates(\?|$)/, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(candidatesListPayload),
      });
    });

    await page.route(
      (url) => {
        const u = url instanceof URL ? url : new URL(url);
        return (
          u.pathname.replace(/\/$/, "") === `/api/recruiter/candidates/${candidateId}/similar`
        );
      },
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([{ id: "cand-sim-1", similarity: 0.78 }]),
        });
      }
    );

    await page.goto("/recruiter/candidates");
    await page.waitForURL(/\/recruiter\/candidates/, { timeout: 30_000 });

    await page.locator('input[placeholder="React, Node.js, Python..."]').fill("React");
    const searchRes = page.waitForResponse(
      (r) =>
        r.request().method() === "GET" &&
        r.url().includes("/api/recruiter/candidates") &&
        !r.url().includes("/similar")
    );
    await page.getByRole("button", { name: "Apply filters" }).click();
    await searchRes;

    await expect(page.getByText(candidateName)).toBeVisible({ timeout: 15_000 });

    const similar = await page.evaluate(async (id) => {
      const res = await fetch(`/api/recruiter/candidates/${id}/similar`);
      const body = await res.json();
      return { status: res.status, body };
    }, candidateId);
    expect(similar.status).toBe(200);
    expect(similar.body).toEqual(expect.anything());
  });

  test("recruiter messages compose UI can open and submit (smoke)", async ({ page }) => {
    await page.route("**/api/messages/recipient-search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      });
    });

    await page.route(
      (url) => {
        const u = url instanceof URL ? url : new URL(url);
        return u.pathname.replace(/\/$/, "") === "/api/messages";
      },
      async (route) => {
        const req = route.request();
        if (req.method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ messages: [], peer_profiles: {} }),
          });
          return;
        }
        if (req.method() === "POST") {
          await route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({
              id: "msg-1",
              sender_id: "00000000-0000-4000-8000-000000000001",
              receiver_id: "00000000-0000-4000-8000-000000000002",
              job_id: null,
              subject: null,
              content: "Hello from Playwright smoke test",
              is_read: false,
              template_name: null,
              created_at: new Date().toISOString(),
            }),
          });
          return;
        }
        await route.fallback();
      }
    );

    await page.goto(
      "/recruiter/messages?compose=1&receiver_id=00000000-0000-4000-8000-000000000002",
      { waitUntil: "domcontentloaded" }
    );
    await page.waitForURL(/\/recruiter\/messages/, { timeout: 30_000 });

    await expect(page.getByText("New Message")).toBeVisible();
    await expect(page.getByText(/00000002/)).toBeVisible();
    await expect(page.getByPlaceholder("Write your message...")).toBeVisible();

    await page.getByPlaceholder("Write your message...").fill("Hello from Playwright smoke test");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText("Select a conversation")).toBeVisible({ timeout: 15_000 });
  });
});
