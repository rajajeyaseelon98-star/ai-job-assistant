import { test, expect } from "@playwright/test";

function hasRecruiterCreds(): boolean {
  return !!(process.env.E2E_RECRUITER_EMAIL && process.env.E2E_RECRUITER_PASSWORD);
}

test.describe("Real user smoke (recruiter)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async () => {
    if (!hasRecruiterCreds()) test.skip(true, "Missing E2E recruiter credentials env vars.");
  });

  test("recruiter dashboard loads", async ({ page }) => {
    await page.goto("/recruiter", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/recruiter(\/onboarding)?\/?$/);
    // Some accounts may be redirected to onboarding if no company exists.
    await expect(
      page.getByRole("heading", { name: /Recruiter Dashboard|Set up your company/i })
    ).toBeVisible();
  });

  test("recruiter jobs page loads", async ({ page }) => {
    await page.goto("/recruiter/jobs", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/recruiter\/jobs/);
    await expect(page.getByRole("heading", { name: /Job Postings/i })).toBeVisible();
  });

  test("recruiter applications page loads", async ({ page }) => {
    await page.goto("/recruiter/applications", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/recruiter\/applications/);
    const heading = page.getByRole("heading", { name: /Applications Pipeline/i });
    const loading = page.getByText(/Loading applications/i);
    await expect(heading.or(loading)).toBeVisible();
  });
});

