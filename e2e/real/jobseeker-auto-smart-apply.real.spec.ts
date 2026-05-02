import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user jobseeker: auto-apply + smart-apply (best-effort)", () => {
  test.setTimeout(240_000);

  test("auto-apply run + smart-apply rule create/toggle", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");

    const context = await browser.newContext({
      baseURL,
      storageState: authStatePath("jobseeker.json"),
    });
    const page = await context.newPage();

    // Need a resume_id for both auto-apply and smart-apply.
    const resumesRes = await page.request.get("/api/upload-resume");
    expect(resumesRes.ok()).toBeTruthy();
    const resumes = (await resumesRes.json().catch(() => [])) as Array<{ id: string }>;
    const resumeId = resumes?.[0]?.id ?? null;
    if (!resumeId) {
      test.info().annotations.push({
        type: "note",
        description:
          "Skipped auto/smart-apply: no resumes found for this jobseeker account (GET /api/upload-resume empty).",
      });
      await context.close();
      return;
    }

    // 1) Auto-apply: trigger run (Pro usage limits may block with 403).
    const runRes = await page.request.post("/api/auto-apply", {
      data: { resume_id: resumeId, max_results: 5 },
    });
    if (runRes.status() === 403) {
      test.info().annotations.push({
        type: "note",
        description: "Auto-apply is blocked for this account (likely free plan limit).",
      });
    } else {
      expect(runRes.ok()).toBeTruthy();
      const run = (await runRes.json()) as { id: string; status: string };
      expect(run.id).toBeTruthy();

      // Poll run status lightly (engine is async); accept any non-404 response shape.
      const detailRes = await page.request.get(`/api/auto-apply/${encodeURIComponent(run.id)}`);
      expect(detailRes.ok()).toBeTruthy();

      // UI should load and show run list / status area.
      await page.goto("/auto-apply", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: /AI Auto-Apply/i })).toBeVisible({ timeout: 30_000 });
    }

    // 2) Smart-apply: attempt rule create (Pro-only); then toggle via PATCH if created.
    const ruleCreate = await page.request.post("/api/smart-apply", {
      data: {
        resume_id: resumeId,
        min_match_score: 75,
        preferred_roles: [],
        preferred_locations: [],
        include_remote: true,
        max_applications_per_day: 1,
        max_applications_per_week: 3,
        enabled: true,
      },
    });

    if (ruleCreate.status() === 403) {
      test.info().annotations.push({
        type: "note",
        description: "Smart Auto-Apply is blocked for this account (Pro feature).",
      });
    } else {
      expect(ruleCreate.ok()).toBeTruthy();
      const rule = (await ruleCreate.json().catch(() => null)) as { id?: string } | null;
      const ruleId = rule?.id ?? null;
      if (ruleId) {
        const toggle = await page.request.patch("/api/smart-apply", { data: { id: ruleId, enabled: false } });
        expect(toggle.ok()).toBeTruthy();
      }
      await page.goto("/smart-apply", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: /Smart Auto-Apply/i })).toBeVisible({
        timeout: 30_000,
      });
    }

    await context.close();
  });
});

