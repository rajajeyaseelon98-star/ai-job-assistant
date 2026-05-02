import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user jobseeker: cover letter + improve resume (best-effort)", () => {
  test.setTimeout(240_000);

  test("generate cover letter → shows in history; improve resume → shows in history", async ({
    browser,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");

    const context = await browser.newContext({
      baseURL,
      storageState: authStatePath("jobseeker.json"),
    });
    const page = await context.newPage();

    // Need a resume id for improve-resume and to avoid huge pasted payloads.
    const resumesRes = await page.request.get("/api/upload-resume");
    expect(resumesRes.ok()).toBeTruthy();
    const resumes = (await resumesRes.json().catch(() => [])) as Array<{ id: string }>;
    const resumeId = resumes?.[0]?.id ?? null;
    if (!resumeId) {
      test.info().annotations.push({
        type: "note",
        description:
          "Skipped cover-letter/improve-resume: no resumes found for this jobseeker account (GET /api/upload-resume empty).",
      });
      await context.close();
      return;
    }

    const stamp = Date.now().toString().slice(-6);
    const companyName = `E2E Co ${stamp}`;
    const role = `QA Engineer ${stamp}`;
    const jobDescription = `We are hiring a QA Engineer. Must know Playwright, TypeScript, CI pipelines. (${stamp})`;

    // 1) Generate cover letter via API (stable) then verify History shows it.
    const gen = await page.request.post("/api/generate-cover-letter", {
      data: { resumeId, companyName, role, jobDescription },
    });
    if (gen.status() === 403 || gen.status() === 402) {
      test.info().annotations.push({
        type: "note",
        description: "Cover letter generation blocked (plan limit or credits exhausted).",
      });
    } else {
      expect(gen.ok()).toBeTruthy();
      await page.goto("/history", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "History" })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(companyName, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
    }

    // 2) Improve resume via API (Pro-only) then verify History shows an improved resume entry.
    // Provide a minimal JD context; server loads resumeText via resumeId.
    const improve = await page.request.post("/api/improve-resume", {
      data: { resumeText: "use-resumeId", resumeId, jobTitle: role, jobDescription },
    });
    if (improve.status() === 403 || improve.status() === 402) {
      test.info().annotations.push({
        type: "note",
        description: "Resume improve blocked (Pro feature or credits exhausted).",
      });
    } else {
      expect(improve.ok()).toBeTruthy();
      await page.goto("/history", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "History" })).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText("Improved Resumes", { exact: true })).toBeVisible({ timeout: 30_000 });
      // The item label is job_title or "Improved Resume"; we use role substring when available.
      await expect(page.getByText(role, { exact: false }).first()).toBeVisible({ timeout: 30_000 });
    }

    await context.close();
  });
});

