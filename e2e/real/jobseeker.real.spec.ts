import { test, expect } from "@playwright/test";

function hasJobseekerCreds(): boolean {
  return !!(process.env.E2E_JOBSEEKER_EMAIL && process.env.E2E_JOBSEEKER_PASSWORD);
}

test.describe("Real user smoke (jobseeker)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async () => {
    if (!hasJobseekerCreds()) test.skip(true, "Missing E2E jobseeker credentials env vars.");
  });

  test("dashboard loads", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    // Login uses the same “Welcome back” h1 as the dashboard — require the real route.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
  });

  test("resume analyzer loads", async ({ page }) => {
    await page.goto("/resume-analyzer", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/resume-analyzer/);
    await expect(page.getByRole("heading", { name: "Resume Analyzer" })).toBeVisible();
  });

  test("job match loads", async ({ page }) => {
    await page.goto("/job-match", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/job-match/);
    await expect(page.getByRole("heading", { name: /Job Match/i })).toBeVisible();
  });

  test("application tracker loads", async ({ page }) => {
    await page.goto("/applications", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/applications/);
    await expect(page.getByRole("heading", { name: "Application Tracker" })).toBeVisible();
  });
});

