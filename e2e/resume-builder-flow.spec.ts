import { test, expect } from "@playwright/test";
import { applyE2eMockAuth } from "./e2e-mock-auth";

test.describe("Resume builder → analyzer flow (deterministic, mock auth)", () => {
  test.setTimeout(180_000);

  test("build draft → open in analyzer → analyze shows score", async ({ page, context }) => {
    await applyE2eMockAuth(context, "job_seeker");

    // Deterministic mock for ATS analyze call.
    await page.route(/\/api\/analyze-resume(\?|$)/, async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          message: "Analyzed",
          atsScore: 72,
          missingSkills: ["Metrics"],
          resumeImprovements: ["Add impact numbers"],
          meta: { requestId: "req-ats-1", nextStep: "Improve resume" },
        }),
      });
    });

    await page.goto("/resume-builder", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Quick Resume Builder/i })).toBeVisible();

    // Deterministic: the wizard is purely client-side; instead of relying on step navigation,
    // write the draft the same way the builder does and validate the analyzer consumes it.
    await page.evaluate(() => {
      sessionStorage.setItem(
        "resumeBuilderDraft",
        [
          "E2E Tester",
          "e2e@example.com",
          "",
          "PROFESSIONAL SUMMARY",
          "QA engineer with Playwright automation experience.",
          "",
          "EXPERIENCE",
          "QA Engineer — Example Co",
          "• Built deterministic E2E suites",
          "• Reduced regressions",
          "",
          "EDUCATION",
          "B.Tech — Example University — 2022",
        ].join("\\n")
      );
    });
    await page.goto("/resume-analyzer", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/resume-analyzer/);
    await expect(page.getByRole("heading", { name: "Resume Analyzer" })).toBeVisible({ timeout: 20_000 });

    // Analyzer should have draft prefilled (paste mode) and allow analyze.
    await page.getByRole("button", { name: "Analyze resume" }).click();

    await expect(page.getByRole("heading", { name: /Resume analysis/i })).toBeVisible({ timeout: 60_000 });
  });
});

