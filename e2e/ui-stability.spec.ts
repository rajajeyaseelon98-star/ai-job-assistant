import { test, expect } from "@playwright/test";
import { applyE2eMockAuth } from "./e2e-mock-auth";

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const ok = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth <= doc.clientWidth + 1;
  });
  expect(ok).toBeTruthy();
}

test.describe("UI stability sweep (deterministic, mock auth)", () => {
  test.setTimeout(120_000);

  test("jobseeker routes: no overflow", async ({ page, context }) => {
    await applyE2eMockAuth(context, "job_seeker");
    for (const route of ["/dashboard", "/resume-analyzer", "/job-match", "/applications", "/job-board"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expectNoHorizontalOverflow(page);
    }
  });

  test("recruiter routes: no overflow", async ({ page, context }) => {
    await applyE2eMockAuth(context, "recruiter");
    for (const route of ["/recruiter", "/recruiter/jobs", "/recruiter/applications"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expectNoHorizontalOverflow(page);
    }
  });
});

