import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { applyE2eMockAuth } from "./e2e-mock-auth";

/**
 * Deterministic **full page inventory** (`docs/QA_ROUTE_INVENTORY.md`): visits every listed page route
 * with mock cookie auth (no Supabase passwords). Dynamic segments use placeholder IDs/strings.
 *
 * Complements `e2e/site-wide-sweep.spec.ts` (curated list) and real-user `e2e/real/route-inventory-static-render.real.spec.ts`.
 */

const PLACEHOLDER_UUID = "00000000-0000-4000-8000-00000000aa01";
const PLACEHOLDER_SLUG = "qa-inventory-placeholder-slug";

function extractInventoryPages(md: string): string[] {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === "## Pages (66)");
  if (start === -1) return [];
  const out: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith("## ")) break;
    const m = t.match(/^- `([^`]+)`/);
    if (m?.[1]) out.push(m[1]);
  }
  return out;
}

function expandInventoryRoute(route: string): string {
  const map: Record<string, string> = {
    "/jobs/:slug": `/jobs/${PLACEHOLDER_SLUG}`,
    "/salary/:slug": `/salary/${PLACEHOLDER_SLUG}`,
    "/u/:slug": `/u/${PLACEHOLDER_SLUG}`,
    "/results/:token": `/results/${PLACEHOLDER_UUID}`,
    "/share/:token": `/share/${PLACEHOLDER_UUID}`,
    "/recruiter/candidates/:id": `/recruiter/candidates/${PLACEHOLDER_UUID}`,
    "/recruiter/jobs/:id": `/recruiter/jobs/${PLACEHOLDER_UUID}`,
    "/recruiter/jobs/:id/auto-shortlist": `/recruiter/jobs/${PLACEHOLDER_UUID}/auto-shortlist`,
    "/recruiter/jobs/:id/optimize": `/recruiter/jobs/${PLACEHOLDER_UUID}/optimize`,
  };
  return map[route] ?? route;
}

function isDynamicRoute(route: string): boolean {
  return route.includes("/:");
}

function isPublicRoute(route: string): boolean {
  return (
    route === "/" ||
    route === "/contact" ||
    route === "/privacy" ||
    route === "/terms" ||
    route === "/skills" ||
    route === "/jobs" ||
    route === "/salary" ||
    route === "/demo" ||
    route === "/login" ||
    route === "/signup" ||
    route === "/login/reset"
  );
}

function isRecruiterRoute(route: string): boolean {
  return route === "/recruiter" || route.startsWith("/recruiter/");
}

function isJobseekerRoute(route: string): boolean {
  return !isPublicRoute(route) && !isRecruiterRoute(route);
}

async function assertNoErrorBoundary(page: import("@playwright/test").Page) {
  const errorUi = page.getByText(/application error|something went wrong|error boundary/i).first();
  if (await errorUi.isVisible().catch(() => false)) {
    throw new Error(`Error boundary UI visible at ${page.url()}`);
  }
}

async function assertRendered(page: import("@playwright/test").Page) {
  await assertNoErrorBoundary(page);
  const main = page.locator("main").first();
  if (await main.isVisible().catch(() => false)) return;
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 30_000 });
}

async function gotoWithRetry(page: import("@playwright/test").Page, url: string) {
  let last: unknown = null;
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      return;
    } catch (e) {
      last = e;
      await page.waitForTimeout(500);
    }
  }
  throw last;
}

test.describe("Full site page inventory (mock auth)", () => {
  test.setTimeout(900_000);

  test("every route from docs/QA_ROUTE_INVENTORY.md renders without error UI", async ({
    browser,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("Missing baseURL");

    const invPath = path.join(process.cwd(), "docs", "QA_ROUTE_INVENTORY.md");
    const raw = fs.readFileSync(invPath, "utf-8");
    const listed = extractInventoryPages(raw);
    expect(listed.length).toBeGreaterThan(0);

    const failures: { route: string; ctx: string; error: string }[] = [];

    const publicCtx = await browser.newContext({ baseURL });

    const jsCtx = await browser.newContext({ baseURL });
    await applyE2eMockAuth(jsCtx, "job_seeker");

    const recCtx = await browser.newContext({ baseURL });
    await applyE2eMockAuth(recCtx, "recruiter");

    const publicPage = await publicCtx.newPage();
    const jsPage = await jsCtx.newPage();
    const recPage = await recCtx.newPage();

    for (const routePattern of listed) {
      const route = expandInventoryRoute(routePattern);
      const contextName = isPublicRoute(routePattern)
        ? "public"
        : isRecruiterRoute(routePattern)
          ? "recruiter"
          : "jobseeker";
      const page = contextName === "public" ? publicPage : contextName === "recruiter" ? recPage : jsPage;

      try {
        await gotoWithRetry(page, route);

        if (route === "/login" || route === "/signup" || route.startsWith("/login/")) {
          await assertRendered(page);
          continue;
        }

        const u = new URL(page.url());
        expect(/^(\/login|\/signup)(\/|$)/.test(u.pathname)).toBeFalsy();

        await assertRendered(page);
      } catch (e) {
        failures.push({
          route: `${routePattern} → ${route}`,
          ctx: contextName,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    await publicCtx.close();
    await jsCtx.close();
    await recCtx.close();

    if (failures.length > 0) {
      throw new Error(
        `Page inventory failures (${failures.length}):\n` +
          failures.map((f) => `- [${f.ctx}] ${f.route}: ${f.error}`).join("\n")
      );
    }

    if (listed.some(isDynamicRoute)) {
      test.info().annotations.push({
        type: "note",
        description:
          "Dynamic routes use placeholder IDs; pages may show 404/not-found UI — test only asserts no React error boundary.",
      });
    }
  });
});
