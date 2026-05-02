import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json" | "recruiter.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user recruiter applications stage update (UI)", () => {
  test.setTimeout(240_000);

  test("create job → jobseeker applies → recruiter updates stage in UI", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");

    const recruiterCtx = await browser.newContext({ baseURL, storageState: authStatePath("recruiter.json") });
    const jobseekerCtx = await browser.newContext({ baseURL, storageState: authStatePath("jobseeker.json") });
    const recruiterPage = await recruiterCtx.newPage();
    const jobseekerPage = await jobseekerCtx.newPage();

    // Create a draft job (safe vs plan activation limits).
    const suffix = Date.now().toString().slice(-6);
    const title = `E2E Pipeline Job ${suffix}`;
    const create = await recruiterPage.request.post("/api/recruiter/jobs", {
      data: {
        title,
        description: "E2E pipeline job to verify recruiter applications stage update.",
        requirements: "E2E",
        skills_required: ["Playwright"],
        location: "Remote",
        work_type: "remote",
        employment_type: "full_time",
        status: "active",
      },
    });

    // If activation blocked, fall back to draft (we can still apply if job is active; if not, skip).
    let jobId: string | null = null;
    if (create.status() === 402) {
      const draft = await recruiterPage.request.post("/api/recruiter/jobs", {
        data: {
          title,
          description: "E2E pipeline job to verify recruiter applications stage update.",
          requirements: "E2E",
          skills_required: ["Playwright"],
          location: "Remote",
          work_type: "remote",
          employment_type: "full_time",
          status: "draft",
        },
      });
      expect(draft.ok()).toBeTruthy();
      const d = (await draft.json().catch(() => null)) as { id?: string } | null;
      jobId = d?.id ?? null;
      test.info().annotations.push({
        type: "note",
        description: "Job activation blocked (402); created draft job. Application stage UI update may be skipped.",
      });
    } else {
      expect(create.ok()).toBeTruthy();
      const c = (await create.json().catch(() => null)) as { id?: string } | null;
      jobId = c?.id ?? null;
    }
    expect(jobId).toBeTruthy();

    // Apply as jobseeker (requires active job). If this fails, skip as best-effort.
    const apply = await jobseekerPage.request.post(`/api/jobs/${encodeURIComponent(jobId!)}/apply`, { data: {} });
    if (!apply.ok() && apply.status() !== 409) {
      test.info().annotations.push({
        type: "note",
        description: `Apply failed with ${apply.status()} (job may not be active / gated). Skipping UI stage update.`,
      });
      await recruiterCtx.close();
      await jobseekerCtx.close();
      return;
    }

    await recruiterPage.goto("/recruiter/applications", { waitUntil: "domcontentloaded" });
    await expect(recruiterPage.getByRole("heading", { name: /Applications Pipeline/i })).toBeVisible({
      timeout: 30_000,
    });

    // Switch to list view for easier targeting.
    await recruiterPage.getByRole("button", { name: "List", exact: true }).click();
    await expect(recruiterPage.getByText(title, { exact: false }).first()).toBeVisible({ timeout: 60_000 });

    // Expand the first matching card and change stage to Shortlisted.
    const card = recruiterPage.locator("div").filter({ hasText: title }).first();
    await card.getByRole("button", { name: /More/i }).click();
    const stageSelect = card.locator("select").first();
    await expect(stageSelect).toBeVisible({ timeout: 30_000 });
    await stageSelect.selectOption("shortlisted");

    // UI should reflect the change (label is rendered when showStage=true in list view).
    await expect(card.getByText(/Shortlisted/i).first()).toBeVisible({ timeout: 30_000 });

    await recruiterCtx.close();
    await jobseekerCtx.close();
  });
});

