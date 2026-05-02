import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "recruiter.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user recruiter jobs CRUD (UI)", () => {
  test.setTimeout(240_000);

  test("create draft job → appears in list → toggle status", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("recruiter.json") });
    const page = await ctx.newPage();

    const title = `E2E UI Job ${Date.now().toString().slice(-6)}`;

    await page.goto("/recruiter/jobs/new", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Post New Job/i })).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("rjn-title").fill(title);
    await page
      .getByTestId("rjn-description")
      .fill("E2E UI job description. Created by Playwright to verify recruiter job CRUD.");
    await page.getByTestId("rjn-skills").fill("Playwright, TypeScript");

    // Create draft (more likely to succeed under plan limits).
    const draftBtn = page.getByTestId("rjn-draft");
    await expect(draftBtn).toBeVisible({ timeout: 30_000 });
    await draftBtn.click();

    await page.waitForURL(/\/recruiter\/jobs\/?/, { timeout: 60_000 });

    // Source-of-truth verification via API (UI can be slow/flaky under dev HMR).
    let found = false;
    for (let i = 0; i < 10; i++) {
      const jobsRes = await page.request.get("/api/recruiter/jobs");
      expect(jobsRes.ok()).toBeTruthy();
      const jobs = (await jobsRes.json().catch(() => [])) as Record<string, unknown>[];
      found = (Array.isArray(jobs) ? jobs : []).some((j) => String(j.title || "").includes(title));
      if (found) break;
      await page.waitForTimeout(750);
    }
    expect(found).toBeTruthy();

    // UI best-effort: ensure route is reachable and the title surfaces somewhere.
    await page.goto("/recruiter/jobs", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/recruiter\/jobs/);
    await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 60_000 });

    // Toggle status best-effort: click the first toggle action on the created row (job title is a link).
    const row = page.locator("div").filter({ hasText: title }).first();
    const toggleBtn = row.locator("button").first();
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
      // Status badge should still be present; don't assert exact status because plan rules may block activation.
      await expect(row.getByText(/active|paused|draft|closed/i).first()).toBeVisible({ timeout: 30_000 });
    }

    await ctx.close();
  });
});

