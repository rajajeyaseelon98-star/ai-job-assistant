import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authDir = path.join(process.cwd(), "playwright", ".auth");

function appOrigin(): string {
  const port = process.env.PLAYWRIGHT_PORT ?? "3010";
  const base = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
  return new URL(base).origin;
}

function requireEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v : null;
}

/**
 * Playwright's `storageState({ path })` can serialize to empty `cookies` / `origins` with
 * `@supabase/ssr` (chunked cookies + PKCE). Merge browser CDP cookies and full localStorage
 * for the app origin so dependent projects get a restorable session for middleware.
 */
async function saveEnrichedStorageState(
  page: import("@playwright/test").Page,
  statePath: string
) {
  const origin = appOrigin();
  // Wait briefly for Supabase cookie storage to flush.
  await page
    .waitForFunction(
      () => {
        try {
          return document.cookie.split(";").some((p) => p.trim().startsWith("sb-"));
        } catch {
          return false;
        }
      },
      null,
      { timeout: 10_000 }
    )
    .catch(() => undefined);
  await page.waitForTimeout(300);

  const localStorageItems = await page.evaluate(() => {
    const out: { name: string; value: string }[] = [];
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const name = localStorage.key(i);
        if (!name) continue;
        out.push({ name, value: localStorage.getItem(name) ?? "" });
      }
    } catch {
      /* ignore */
    }
    return out;
  });

  const cookies = await page.context().cookies();

  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(
    statePath,
    JSON.stringify({ cookies, origins: [{ origin, localStorage: localStorageItems }] }, null, 2),
    "utf8"
  );
}

async function loginAndSaveState(opts: {
  page: import("@playwright/test").Page;
  email: string;
  password: string;
  targetRole: "job_seeker" | "recruiter";
  statePath: string;
}) {
  const { page, email, password, targetRole, statePath } = opts;

  const internalSecret = process.env.E2E_INTERNAL_AUTH_SECRET?.trim() || "";
  if (internalSecret) {
    // More reliable than UI login: sets HttpOnly Supabase cookies server-side.
    const res = await page.request.post("/api/internal/e2e-password-login", {
      data: { email, password },
      headers: { "x-e2e-auth-secret": internalSecret },
    });
    if (res.ok()) {
      // Navigate into app shell so middleware/session is established.
      await page.goto("/select-role", { waitUntil: "domcontentloaded" });
    } else {
      // Network hiccups to Supabase can happen (connect timeouts). Fall back to UI login
      // rather than failing the entire suite.
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();

      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign in" }).click();
    }
  } else {
    // Fallback: UI login (works when cookie persistence is reliable).
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
  }

  // Some accounts/flows may route through role selection. If login fails, the page
  // usually stays on /login and shows a role="alert" message.
  const appAlert = page.locator("main").getByRole("alert").first();
  const loginResult = await Promise.race([
    page
      .waitForURL(/\/(dashboard|recruiter|select-role)/, { timeout: 120_000 })
      .then(() => "navigated" as const)
      .catch(() => null),
    // Supabase client login stores a session in localStorage even before any server-side
    // middleware/cookie sync happens. This allows us to proceed even if client routing is flaky.
    page
      .waitForFunction(() => {
        try {
          for (let i = 0; i < localStorage.length; i += 1) {
            const k = localStorage.key(i) || "";
            if (k.startsWith("sb-") && k.includes("auth-token")) return true;
          }
          return false;
        } catch {
          return false;
        }
      }, null, { timeout: 120_000 })
      .then(() => "session" as const)
      .catch(() => null),
    appAlert
      .waitFor({ timeout: 120_000 })
      .then(() => "alert" as const)
      .catch(() => null),
  ]);

  if (loginResult === "alert") {
    const alertText = (await appAlert.textContent().catch(() => null))?.trim() ?? "";
    throw new Error(alertText ? `Login failed: ${alertText}` : "Login did not navigate away from /login.");
  }

  if (loginResult === "session") {
    // If client routing didn't move us, explicitly navigate to let server-side auth settle.
    await page.goto("/select-role", { waitUntil: "domcontentloaded" });
  }

  const p = new URL(page.url()).pathname;
  if (p === "/select-role") {
    const roleBtnName = targetRole === "job_seeker" ? /Job Seeker/i : /Recruiter/i;
    await page.getByRole("button", { name: roleBtnName }).click();
    await page.waitForURL(targetRole === "job_seeker" ? /\/dashboard/ : /\/recruiter/, { timeout: 60_000 });
  }

  await saveEnrichedStorageState(page, statePath);
}

setup("real login: jobseeker storageState", async ({ page }) => {
  setup.setTimeout(180_000);
  const email = requireEnv("E2E_JOBSEEKER_EMAIL");
  const password = requireEnv("E2E_JOBSEEKER_PASSWORD");
  if (!email || !password) {
    setup.skip(true, "Missing E2E jobseeker credentials env vars.");
    return;
  }

  fs.mkdirSync(authDir, { recursive: true });
  const statePath = path.join(authDir, "jobseeker.json");

  await loginAndSaveState({
    page,
    email,
    password,
    targetRole: "job_seeker",
    statePath,
  });
});

setup("real login: recruiter storageState", async ({ page }) => {
  setup.setTimeout(180_000);
  const email = requireEnv("E2E_RECRUITER_EMAIL");
  const password = requireEnv("E2E_RECRUITER_PASSWORD");
  if (!email || !password) {
    setup.skip(true, "Missing E2E recruiter credentials env vars.");
    return;
  }

  fs.mkdirSync(authDir, { recursive: true });
  const statePath = path.join(authDir, "recruiter.json");

  await loginAndSaveState({
    page,
    email,
    password,
    targetRole: "recruiter",
    statePath,
  });
});
