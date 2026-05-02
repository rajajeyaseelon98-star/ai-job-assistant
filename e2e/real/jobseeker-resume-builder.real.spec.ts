import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user quick resume builder", () => {
  test.setTimeout(180_000);

  test("resume builder draft → opens in resume analyzer", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("jobseeker.json") });
    const page = await ctx.newPage();

    await page.goto("/resume-builder", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Quick Resume Builder/i })).toBeVisible({ timeout: 30_000 });

    await page.getByTestId("rb-full-name").fill("E2E Builder");
    await page.getByTestId("rb-email").fill(`e2e+${Date.now().toString().slice(-6)}@example.com`);
    await page.getByTestId("rb-location").fill("Remote");
    await page.getByTestId("rb-next").click();

    await page.getByTestId("rb-summary").fill("QA engineer focused on Playwright E2E reliability.");
    await page.getByTestId("rb-next").click();

    await page
      .getByTestId("rb-experience")
      .fill("QA Engineer — Company\n• Built Playwright suite\n• Reduced regressions\n");
    await page.getByTestId("rb-next").click();

    await page.getByTestId("rb-education").fill("B.Tech — 2022");
    // Ensure draft is set before navigation (the analyzer may consume/clear it).
    const openBtn = page.getByTestId("rb-open-analyzer");
    await openBtn.click();

    await expect(page).toHaveURL(/\/resume-analyzer/);
    await expect(page.getByRole("heading", { name: "Resume Analyzer" })).toBeVisible({ timeout: 30_000 });

    await ctx.close();
  });
});

