import { test, expect } from "@playwright/test";

/**
 * Unauthenticated smoke: middleware redirects and protected API behavior.
 * No Supabase credentials required.
 *
 * Clears cookies + origin storage so a leftover Supabase session on localhost does not skew redirects.
 */
test.describe("Public + protected API (no auth)", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        /* ignore */
      }
    });
  });

  test("GET /api/user without session returns 401", async ({ request }) => {
    const res = await request.get("/api/user");
    expect(res.status()).toBe(401);
    const body = await res.json().catch(() => ({}));
    expect(body).toMatchObject({ error: "Unauthorized" });
  });

  test("GET /api/recruiter/jobs without session returns 401", async ({ request }) => {
    const res = await request.get("/api/recruiter/jobs");
    expect(res.status()).toBe(401);
    const body = await res.json().catch(() => ({}));
    expect(body).toMatchObject({ error: "Unauthorized" });
  });

  test("GET /api/dashboard without session returns 401", async ({ request }) => {
    const res = await request.get("/api/dashboard");
    expect(res.status()).toBe(401);
    const body = await res.json().catch(() => ({}));
    expect(body).toMatchObject({ error: "Unauthorized" });
  });

  test("unauthenticated /dashboard redirects to login with next param", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe("/dashboard");
  });

  test("unauthenticated /select-role redirects to login", async ({ page }) => {
    await page.goto("/select-role", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe("/select-role");
  });

  test("unauthenticated /recruiter redirects to login", async ({ page }) => {
    await page.goto("/recruiter", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe("/recruiter");
  });

  test("unauthenticated /recruiter/jobs/new redirects to login with next param", async ({
    page,
  }) => {
    await page.goto("/recruiter/jobs/new", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe("/recruiter/jobs/new");
  });

  test("login page renders email field and Sign in", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});
