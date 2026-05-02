import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user jobseeker history drilldown", () => {
  test.setTimeout(180_000);

  test("history loads and sections render; view links best-effort", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("jobseeker.json") });
    const page = await ctx.newPage();

    await page.goto("/history", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "History" })).toBeVisible({ timeout: 30_000 });

    for (const section of ["Resume Analysis", "Job Matches", "Improved Resumes", "Cover Letters"]) {
      await expect(page.getByRole("heading", { name: section })).toBeVisible({ timeout: 30_000 });
    }

    // Best-effort: open first cover letter if present.
    const coverView = page.getByRole("link", { name: "View" }).first();
    if (await coverView.isVisible().catch(() => false)) {
      await coverView.click();
      await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
    }

    await ctx.close();
  });
});

