import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json" | "recruiter.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

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

function isDynamicRoute(route: string): boolean {
  return route.includes("/:") || route.includes(":");
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

async function assertNoErrorUI(page: import("@playwright/test").Page) {
  const errorText = page.getByText(/application error|something went wrong|error boundary/i).first();
  if (await errorText.isVisible().catch(() => false)) {
    throw new Error(`Error UI visible on ${page.url()}`);
  }
}

async function assertRenders(page: import("@playwright/test").Page) {
  await assertNoErrorUI(page);
  const main = page.locator("main").first();
  if (await main.isVisible().catch(() => false)) return;
  await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 30_000 });
}

test.describe("Route inventory: static route render (real-user)", () => {
  test.setTimeout(600_000);

  async function gotoWithRetry(page: import("@playwright/test").Page, route: string) {
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
        return;
      } catch (e) {
        lastErr = e;
        await page.waitForTimeout(750);
      }
    }
    throw lastErr;
  }

  test("all non-dynamic routes from docs/QA_ROUTE_INVENTORY.md render", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");

    const invPath = path.join(process.cwd(), "docs", "QA_ROUTE_INVENTORY.md");
    const raw = fs.readFileSync(invPath, "utf-8");
    const pages = extractInventoryPages(raw);
    expect(pages.length).toBeGreaterThan(0);

    const dynamic = pages.filter(isDynamicRoute);
    const staticRoutes = pages.filter((r) => !isDynamicRoute(r));

    // Dynamic routes are validated by dedicated real-user specs (seeded best-effort).
    // Keeping the assertion explicit avoids “silent gaps”.
    const expectedDynamic = [
      "/jobs/:slug",
      "/salary/:slug",
      "/u/:slug",
      "/results/:token",
      "/share/:token",
      "/recruiter/candidates/:id",
      "/recruiter/jobs/:id",
      "/recruiter/jobs/:id/auto-shortlist",
      "/recruiter/jobs/:id/optimize",
    ];
    for (const r of expectedDynamic) expect(dynamic).toContain(r);

    const publicCtx = await browser.newContext({ baseURL });
    const jobseekerCtx = await browser.newContext({
      baseURL,
      storageState: authStatePath("jobseeker.json"),
    });
    const recruiterCtx = await browser.newContext({
      baseURL,
      storageState: authStatePath("recruiter.json"),
    });

    const publicPage = await publicCtx.newPage();
    const jobseekerPage = await jobseekerCtx.newPage();
    const recruiterPage = await recruiterCtx.newPage();

    const failures: { route: string; context: "public" | "jobseeker" | "recruiter"; error: string }[] = [];

    for (const route of staticRoutes) {
      const context: "public" | "jobseeker" | "recruiter" = isPublicRoute(route)
        ? "public"
        : isRecruiterRoute(route)
          ? "recruiter"
          : "jobseeker";
      const p = context === "public" ? publicPage : context === "recruiter" ? recruiterPage : jobseekerPage;

      try {
        await gotoWithRetry(p, route);

        // Allow auth redirect behavior for public auth pages.
        if (route === "/login" || route === "/signup" || route.startsWith("/login/")) {
          await assertRenders(p);
          continue;
        }

        // Normal: should land somewhere non-auth. Some routes (like /) can redirect when authed.
        const u = new URL(p.url());
        expect(/^(\/login|\/signup)(\/|$)/.test(u.pathname)).toBeFalsy();

        await assertRenders(p);
      } catch (e) {
        failures.push({
          route,
          context,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `Static route render failures (${failures.length}):\n` +
          failures.map((f) => `- [${f.context}] ${f.route}: ${f.error}`).join("\n")
      );
    }

    await publicCtx.close();
    await jobseekerCtx.close();
    await recruiterCtx.close();
  });
});

