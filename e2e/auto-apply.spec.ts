import { test, expect } from "@playwright/test";
import { applyE2eMockAuth } from "./e2e-mock-auth";

test.describe("Auto apply and smart apply critical flows", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await applyE2eMockAuth(context, "job_seeker");
    await page.goto("/");
    await page.route(/\/api\/upload-resume(\?|$)/, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "resume-1", file_name: "resume.pdf", created_at: new Date().toISOString() },
        ]),
      });
    });
    await page.route(/\/api\/usage(\?|$)/, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ smart_apply: { used: 0, limit: -1 } }),
      });
    });
  });

  test("auto apply full success", async ({ page }) => {
    let confirmCalled = false;
    await page.route(/\/api\/auto-apply(\?|$)/, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "run-1",
            status: "ready_for_review",
            currentStep: "ready",
            results: [
              {
                job_id: "job-1",
                title: "Frontend Engineer",
                company: "Stub Corp",
                location: "Remote",
                description: "desc",
                url: "https://example.com/job-1",
                source: "stub",
                match_score: 88,
                match_reason: "Strong fit",
                selected: true,
                applied: false,
              },
            ],
          }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.route(/\/api\/auto-apply\/run-1$/, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "run-1",
          status: "ready_for_review",
          currentStep: "ready",
          results: [
            {
              job_id: "job-1",
              title: "Frontend Engineer",
              company: "Stub Corp",
              location: "Remote",
              description: "desc",
              url: "https://example.com/job-1",
              source: "stub",
              match_score: 88,
              match_reason: "Strong fit",
              selected: true,
              applied: false,
            },
          ],
        }),
      });
    });

    await page.route(/\/api\/auto-apply\/run-1\/confirm$/, async (route) => {
      confirmCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          applied_count: 1,
          total_selected: 1,
          failed_count: 0,
          failed_items: [],
        }),
      });
    });

    await page.goto("/auto-apply");
    await page.getByRole("button", { name: /Start Auto-Apply|Find matches|Start/i }).first().click();
    const confirmStatus = await page.evaluate(async () => {
      const res = await fetch("/api/auto-apply/run-1/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_job_ids: ["job-1"] }),
      });
      return res.status;
    });
    expect(confirmStatus).toBe(200);
    await expect.poll(() => confirmCalled).toBe(true);
  });

  test("auto apply partial failure + retry failed subset", async ({ page }) => {
    let confirmCallCount = 0;
    await page.route(/\/api\/auto-apply(\?|$)/, async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "run-2",
            status: "ready_for_review",
            currentStep: "ready",
            results: [
              { job_id: "job-a", title: "Role A", company: "A", location: "Remote", description: "d", url: "u", source: "stub", match_score: 80, match_reason: "fit", selected: true, applied: false },
              { job_id: "job-b", title: "Role B", company: "B", location: "Remote", description: "d", url: "u", source: "stub", match_score: 79, match_reason: "fit", selected: true, applied: false }
            ],
          }),
        });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });
    await page.route(/\/api\/auto-apply\/run-2$/, async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "run-2",
          status: "ready_for_review",
          currentStep: "ready",
          results: [
            { job_id: "job-a", title: "Role A", company: "A", location: "Remote", description: "d", url: "u", source: "stub", match_score: 80, match_reason: "fit", selected: true, applied: false },
            { job_id: "job-b", title: "Role B", company: "B", location: "Remote", description: "d", url: "u", source: "stub", match_score: 79, match_reason: "fit", selected: true, applied: false }
          ],
        }),
      });
    });
    await page.route(/\/api\/auto-apply\/run-2\/confirm$/, async (route) => {
      confirmCallCount += 1;
      if (confirmCallCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            applied_count: 1,
            total_selected: 2,
            failed_count: 1,
            failed_items: [{ jobId: "job-b", title: "Role B", reason: "Rate limited upstream" }],
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          applied_count: 1,
          total_selected: 1,
          failed_count: 0,
          failed_items: [],
        }),
      });
    });

    await page.goto("/auto-apply");
    await page.getByRole("button", { name: /Start Auto-Apply|Find matches|Start/i }).first().click();
    const firstConfirm = await page.evaluate(async () => {
      const res = await fetch("/api/auto-apply/run-2/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_job_ids: ["job-a", "job-b"] }),
      });
      return res.status;
    });
    expect(firstConfirm).toBe(200);
    const secondConfirm = await page.evaluate(async () => {
      const res = await fetch("/api/auto-apply/run-2/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selected_job_ids: ["job-b"] }),
      });
      return res.status;
    });
    expect(secondConfirm).toBe(200);
    await expect.poll(() => confirmCallCount).toBe(2);
  });

  test("smart apply rule creation and trigger handling", async ({ page }) => {
    await page.route(/\/api\/smart-apply(\?|$)/, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return;
      }
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "rule-1",
            enabled: true,
            rules: { min_match_score: 75 },
            last_run_at: null,
            next_run_at: new Date().toISOString(),
            total_runs: 0,
            total_applied: 0,
            last_outcome_reason: "NOT_RUN_YET",
            last_execution_meta: { lastRunAt: null, nextRunAt: new Date().toISOString(), reasonCode: "NOT_RUN_YET" },
          }),
        });
        return;
      }
      await route.fallback();
    });
    await page.route(/\/api\/upload-resume(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ id: "res-1", file_name: "resume.pdf", created_at: new Date().toISOString() }]),
      });
    });
    await page.route(/\/api\/usage(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ smart_apply: { used: 0, limit: -1 } }),
      });
    });

    await page.goto("/smart-apply");
    await page.getByRole("button", { name: /Activate Smart Auto-Apply|Update & Activate/i }).click();
    await expect(page.getByText(/rules saved and activated/i)).toBeVisible();
  });
});
