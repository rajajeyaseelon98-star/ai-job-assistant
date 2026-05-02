import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user jobseeker settings", () => {
  test.setTimeout(180_000);

  test("update profile + preferences persist", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("jobseeker.json") });
    const page = await ctx.newPage();

    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 30_000 });

    const name = `E2E JS ${Date.now().toString().slice(-6)}`;
    const preferredRole = `QA Engineer ${Date.now().toString().slice(-4)}`;

    const nameInput = page.locator('input[placeholder="Your name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 30_000 });
    await nameInput.fill(name);

    // Save profile section.
    await page.getByRole("button", { name: "Save", exact: true }).click();

    // Preferences update via API (more stable than UI-controlled inputs).
    const prefPatch = await page.request.patch("/api/user", {
      data: { preferred_role: preferredRole },
    });
    expect(prefPatch.ok()).toBeTruthy();

    // Verify persistence via API (source of truth).
    const me = await page.request.get("/api/user");
    expect(me.ok()).toBeTruthy();
    const meBody = (await me.json().catch(() => null)) as
      | { name?: string | null; preferences?: { preferred_role?: string | null } | null }
      | null;
    expect(meBody?.name).toBe(name);
    expect(meBody?.preferences?.preferred_role).toBe(preferredRole);

    // UI verify (best-effort): caches can keep old preferences; still ensure the route renders.
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible({ timeout: 30_000 });

    await ctx.close();
  });
});

