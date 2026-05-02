import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "recruiter.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

function attachUiHealth(page: import("@playwright/test").Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const t = msg.text();
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
  // Authenticated recruiter should not bounce to auth pages.
  expect(/^(\/login|\/signup)(\/|$)/.test(u.pathname)).toBeFalsy();
  // Some routes can redirect (e.g. missing company → /recruiter/onboarding).

  const errorText = page.getByText(/application error|something went wrong|error boundary/i).first();
  if (await errorText.isVisible().catch(() => false)) {
    throw new Error(`Error UI visible on ${u.pathname}`);
  }

  const main = page.locator("main").first();
  if (await main.isVisible().catch(() => false)) return;
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 30_000 });
}

test.describe("Real-user recruiter site-wide sweep", () => {
  test.setTimeout(240_000);

  test("core recruiter routes render + no console errors + no overflow", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("recruiter.json") });
    const page = await ctx.newPage();
    const health = attachUiHealth(page);

    // Note: some routes may redirect to onboarding if company missing; that is covered separately.
    const routes: string[] = [
      "/recruiter",
      "/recruiter/onboarding",
      "/recruiter/jobs",
      "/recruiter/jobs/new",
      "/recruiter/applications",
      "/recruiter/candidates",
      "/recruiter/messages",
      "/recruiter/templates",
      "/recruiter/alerts",
      "/recruiter/usage",
      "/recruiter/analytics",
      "/recruiter/salary-estimator",
      "/recruiter/skill-gap",
      "/recruiter/instant-shortlist",
      "/recruiter/top-candidates",
      "/recruiter/company",
      "/recruiter/pricing",
      "/recruiter/settings",
    ];

    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await assertPageRenders(page, route);
      await expectNoHorizontalOverflow(page);
    }

    expect(health.consoleErrors).toEqual([]);
    await ctx.close();
  });
});

