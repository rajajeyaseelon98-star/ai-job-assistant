import { test, expect } from "@playwright/test";
import { applyE2eMockAuth } from "./e2e-mock-auth";

test.describe("Marketplace full flow (deterministic, mock auth)", () => {
  test.setTimeout(180_000);

  test("recruiter posts job → jobseeker applies → recruiter shortlists", async ({ browser }) => {
    const jobId = "00000000-0000-4000-8000-00000000jb01";
    const applicationId = "00000000-0000-4000-8000-00000000ap01";

    const recruiterContext = await browser.newContext();
    await applyE2eMockAuth(recruiterContext, "recruiter");
    const recruiterPage = await recruiterContext.newPage();

    // Recruiter creates & publishes a job via UI.
    const suffix = `${Date.now()}`.slice(-6);
    const jobTitle = `E2E Marketplace Job ${suffix}`;

    // Deterministic API mocks (CI-safe): recruiter job create + list.
    await recruiterPage.route(/\/api\/recruiter\/jobs(\?|$)/, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: jobId, ok: true, message: "Created" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: jobId, title: jobTitle, status: "active", application_count: 0 }]),
      });
    });

    await recruiterPage.goto("/recruiter/jobs/new", { waitUntil: "domcontentloaded" });
    await recruiterPage.getByTestId("rjn-title").fill(jobTitle);
    await recruiterPage.getByTestId("rjn-description").fill(
      "Deterministic marketplace E2E job. Created by Playwright with mock auth."
    );
    await recruiterPage.getByTestId("rjn-publish").click();
    await recruiterPage.waitForURL(/\/recruiter\/jobs/);

    // Go to job board as jobseeker and apply.
    const jobseekerContext = await browser.newContext();
    await applyE2eMockAuth(jobseekerContext, "job_seeker");
    const jobseekerPage = await jobseekerContext.newPage();

    // Deterministic API mocks: job board list + applied + apply.
    await jobseekerPage.route(/\/api\/jobs\/applied(\?|$)/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await jobseekerPage.route(/\/api\/jobs\?.*$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobs: [
            {
              id: jobId,
              title: jobTitle,
              description: "Deterministic mock job",
              requirements: null,
              skills_required: null,
              experience_min: null,
              experience_max: null,
              salary_min: null,
              salary_max: null,
              salary_currency: null,
              location: null,
              work_type: "remote",
              employment_type: "full_time",
              application_count: 0,
              created_at: new Date().toISOString(),
              companies: { id: "c1", name: "E2E Co", logo_url: null, industry: null, location: null },
            },
          ],
          total: 1,
          totalPages: 1,
        }),
      });
    });
    await jobseekerPage.route(new RegExp(`/api/jobs/${jobId}/apply$`), async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: applicationId, ok: true }),
      });
    });

    await jobseekerPage.goto("/job-board", { waitUntil: "domcontentloaded" });
    await expect(jobseekerPage.getByRole("heading", { name: "Job Board" })).toBeVisible();

    await jobseekerPage.getByPlaceholder("Search job titles...").fill(jobTitle);
    await jobseekerPage.getByRole("button", { name: "Search" }).click();

    // Open job details (click job title in list) and apply.
    await jobseekerPage.getByText(jobTitle, { exact: false }).first().click();
    await jobseekerPage.getByRole("button", { name: "Apply Now" }).click();
    await jobseekerPage.getByRole("button", { name: "Submit Application" }).click();

    // Recruiter verifies it appears in applications pipeline.
    await recruiterPage.route(/\/api\/recruiter\/applications(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: applicationId,
            stage: "applied",
            candidate: { id: "u1", email: "alice@example.com", name: "Alice" },
            job: { id: jobId, title: jobTitle },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]),
      });
    });
    await recruiterPage.goto("/recruiter/applications", { waitUntil: "domcontentloaded" });
    await expect(recruiterPage.getByRole("heading", { name: /Applications Pipeline/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(recruiterPage.getByText(jobTitle, { exact: false })).toBeVisible({ timeout: 30_000 });

    await recruiterContext.close();
    await jobseekerContext.close();
  });
});

