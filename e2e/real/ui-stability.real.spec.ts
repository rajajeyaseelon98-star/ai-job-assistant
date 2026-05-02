import { test, expect } from "@playwright/test";

function attachUiHealth(page: import("@playwright/test").Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
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

test.describe("Real-user UI stability sweep", () => {
  test.setTimeout(120_000);

  test("jobseeker key routes: no console errors + no overflow", async ({ page }) => {
    const health = attachUiHealth(page);

    for (const route of ["/dashboard", "/resume-analyzer", "/job-match", "/applications"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(route.replace(/\//g, "\\/")));
      await expectNoHorizontalOverflow(page);
    }

    expect(health.consoleErrors).toEqual([]);
    // requestfailed fires for aborted dev websocket sometimes; we keep this as report-only for now.
  });

  test("recruiter key routes: no console errors + no overflow", async ({ page }) => {
    const health = attachUiHealth(page);

    for (const route of ["/recruiter", "/recruiter/jobs", "/recruiter/applications"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(new RegExp(route.replace(/\//g, "\\/")));
      await expectNoHorizontalOverflow(page);
    }

    expect(health.consoleErrors).toEqual([]);
  });
});

