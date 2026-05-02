import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json" | "recruiter.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user onboarding flows", () => {
  test.setTimeout(180_000);

  test("jobseeker onboarding: paste resume → score screen", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("jobseeker.json") });
    const page = await ctx.newPage();

    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Let'?s check your resume/i })).toBeVisible({ timeout: 30_000 });

    const resumeText =
      "QA Engineer\nPlaywright, TypeScript, Next.js\nBuilt E2E suites and reduced regressions.\nExperience: 3 years.\n";
    // Use file upload (most reliable) to set resumeText + trigger analysis.
    const fileInput = page.locator('input[type="file"][accept=".txt"]').first();
    await expect(fileInput).toHaveCount(1, { timeout: 30_000 });
    await fileInput.setInputFiles({
      name: "resume.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(resumeText.repeat(25), "utf-8"),
    });

    // Either real analysis loads, or fallback runs; both should show the ATS score UI.
    await expect(page.getByText(/Your ATS Score/i)).toBeVisible({ timeout: 60_000 });
    await ctx.close();
  });

  test("recruiter onboarding: create company (idempotent)", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("recruiter.json") });
    const page = await ctx.newPage();

    await page.goto("/recruiter/onboarding", { waitUntil: "domcontentloaded" });

    // If company already exists, page redirects to /recruiter; accept either.
    await Promise.race([
      page.waitForURL(/\/recruiter\/?$/, { timeout: 30_000 }).catch(() => null),
      page.getByRole("heading", { name: /Set up your company/i }).waitFor({ timeout: 30_000 }).catch(() => null),
    ]);

    const redirected = /\/recruiter\/?$/.test(new URL(page.url()).pathname);
    if (!redirected) {
      await expect(page.getByRole("heading", { name: /Set up your company/i })).toBeVisible({ timeout: 30_000 });

      // Company query can re-render while it resolves; retry fill if the node detaches.
      const companyName = `E2E Co ${Date.now().toString().slice(-6)}`;
      const nameInput = page.locator("form input[required]").first();

      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          await expect(nameInput).toBeVisible({ timeout: 10_000 });
          await expect(nameInput).toBeEditable({ timeout: 10_000 });
          await nameInput.fill(companyName);
          break;
        } catch (e) {
          if (attempt === 3) throw e;
          await page.waitForTimeout(500);
        }
      }

      await page.getByRole("button", { name: "Create company" }).click();
      // Success can show a receipt card or redirect to /recruiter after refresh.
      await Promise.race([
        page.waitForURL(/\/recruiter\/?$/, { timeout: 60_000 }).catch(() => null),
        page.getByText(/Company created/i).waitFor({ timeout: 60_000 }).catch(() => null),
        page.getByRole("link", { name: /Go to Recruiter Dashboard/i }).waitFor({ timeout: 60_000 }).catch(() => null),
        // If it fails, we should still surface it as a deterministic failure signal.
        page.getByText(/try again|error|failed/i).first().waitFor({ timeout: 60_000 }).catch(() => null),
      ]);

      const okRedirect = /\/recruiter\/?$/.test(new URL(page.url()).pathname);
      const okReceipt =
        (await page.getByText(/Company created/i).first().isVisible().catch(() => false)) ||
        (await page.getByRole("link", { name: /Go to Recruiter Dashboard/i }).isVisible().catch(() => false));
      const sawError = await page.getByText(/try again|error|failed/i).first().isVisible().catch(() => false);

      expect(okRedirect || okReceipt).toBeTruthy();
      expect(sawError).toBeFalsy();
    }

    await ctx.close();
  });
});

