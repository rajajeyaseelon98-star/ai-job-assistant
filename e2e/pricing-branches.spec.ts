import { test, expect } from "@playwright/test";
import { applyE2eMockAuth } from "./e2e-mock-auth";

/**
 * Payment integrations are not live; these tests exercise upgrade UI branches only.
 */

test.describe("Pricing / upgrade branches (mock auth)", () => {
  test("jobseeker pricing: upgrade shows alert then navigates to settings", async ({ context, page }) => {
    await context.clearCookies();
    await applyE2eMockAuth(context, "job_seeker");
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Pricing" })).toBeVisible();

    page.once("dialog", async (dialog) => {
      expect(dialog.message()).toMatch(/Payment integration coming soon/i);
      await dialog.accept();
    });

    await page.getByRole("button", { name: "Upgrade to Pro", exact: true }).click();
    await expect(page).toHaveURL(/\/settings$/, { timeout: 15_000 });
  });

  test("recruiter pricing: selecting Pro shows selection confirmation", async ({ context, page }) => {
    await context.clearCookies();
    await applyE2eMockAuth(context, "recruiter");
    await page.goto("/recruiter/pricing", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Recruiter Plans" })).toBeVisible();

    await page.getByRole("button", { name: /^Select plan$/ }).nth(1).click();

    await expect(page.getByText(/You selected the Pro plan/i)).toBeVisible({ timeout: 15_000 });
  });
});
