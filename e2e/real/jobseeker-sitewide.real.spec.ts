import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

function attachUiHealth(page: import("@playwright/test").Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const t = msg.text();
    // Ignore common dev-only warnings that surface as console.error.
    if (/Download the React DevTools/i.test(t)) return;
    if (/Received NaN for the/i.test(t)) return;
    consoleErrors.push(t);
  });
  page.on("requestfailed", (req) => {
    failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText || "failed"}`);
  });

  return { consoleErrors, failedRequests };
}

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const ok = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth + 1;
  });
  expect(ok).toBeTruthy();
}

async function assertPageRenders(page: import("@playwright/test").Page, expectedPathPrefix: string) {
  const u = new URL(page.url());
  // Authenticated jobseeker should not bounce to auth pages.
  expect(/^(\/login|\/signup)(\/|$)/.test(u.pathname)).toBeFalsy();
  // Some routes can legitimately redirect (e.g. onboarding completion → dashboard).

  const errorText = page.getByText(/application error|something went wrong|error boundary/i).first();
  if (await errorText.isVisible().catch(() => false)) {
    throw new Error(`Error UI visible on ${u.pathname}`);
  }

  // Some pages render headings late; accept either main shell or a heading.
  const main = page.locator("main").first();
  if (await main.isVisible().catch(() => false)) return;
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 30_000 });
}

test.describe("Real-user jobseeker site-wide sweep", () => {
  test.setTimeout(180_000);

  test("core jobseeker routes render + no console errors + no overflow", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("jobseeker.json") });
    const page = await ctx.newPage();
    const health = attachUiHealth(page);

    const routes: string[] = [
      "/dashboard",
      "/onboarding",
      "/resume-analyzer",
      "/history",
      "/job-match",
      "/tailor-resume",
      "/cover-letter",
      "/interview-prep",
      "/import-linkedin",
      "/job-board",
      "/job-finder",
      "/auto-apply",
      "/smart-apply",
      "/applications",
      "/messages",
      "/analytics",
      "/activity",
      "/usage",
      "/salary-insights",
      "/skill-demand",
      "/resume-performance",
      "/career-coach",
      "/streak-rewards",
      "/settings",
      "/pricing",
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await assertPageRenders(page, route);
      await expectNoHorizontalOverflow(page);
    }

    // Keep requestfailed as report-only: dev WS/HMR can abort requests.
    expect(health.consoleErrors).toEqual([]);
    await ctx.close();
  });
});

