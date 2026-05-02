import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user jobseeker: Job Match + Resume Tailoring (best-effort)", () => {
  test.setTimeout(240_000);

  test("POST /api/job-match → UI loads; POST /api/improve-resume (tailor) → UI loads", async ({
    browser,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");

    const context = await browser.newContext({
      baseURL,
      storageState: authStatePath("jobseeker.json"),
    });
    const page = await context.newPage();

    // Use an existing resume if available.
    const resumesRes = await page.request.get("/api/upload-resume");
    expect(resumesRes.ok()).toBeTruthy();
    const resumes = (await resumesRes.json().catch(() => [])) as Array<{ id: string; file_name?: string }>;
    const resumeId = resumes?.[0]?.id ?? null;
    if (!resumeId) {
      test.info().annotations.push({
        type: "note",
        description:
          "Skipped job-match/tailor: no resumes found for this jobseeker account (GET /api/upload-resume empty).",
      });
      await context.close();
      return;
    }

    const stamp = Date.now().toString().slice(-6);
    const jobTitle = `Frontend Engineer ${stamp}`;
    const jobDescription = `We need a Frontend Engineer with React, TypeScript, Next.js, Playwright testing. (${stamp})`;

    // 1) Job Match: API-assisted (best-effort for plan limits/credits).
    const matchRes = await page.request.post("/api/job-match", {
      data: {
        resumeId,
        // Backend validates resumeText length, but can be empty string; it will still run match on empty resume,
        // which isn't useful. We send a small resumeText prompt and rely on saved resumeId for history linkage.
        resumeText: "Resume attached via resumeId.",
        jobTitle,
        jobDescription,
      },
    });
    if (matchRes.status() === 403 || matchRes.status() === 402) {
      test.info().annotations.push({
        type: "note",
        description: "Job Match blocked (plan limit or credits exhausted).",
      });
    } else {
      expect(matchRes.ok()).toBeTruthy();
      await page.goto("/job-match", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Job Match" })).toBeVisible({ timeout: 30_000 });
    }

    // 2) Tailor Resume: same backend as improve-resume; best-effort for Pro/credits.
    const tailorRes = await page.request.post("/api/improve-resume", {
      data: {
        resumeText: "Resume attached via resumeId.",
        resumeId,
        jobTitle,
        jobDescription,
        tailorIntent: "target_job",
      },
    });
    if (tailorRes.status() === 403 || tailorRes.status() === 402) {
      test.info().annotations.push({
        type: "note",
        description: "Resume Tailoring blocked (Pro feature or credits exhausted).",
      });
    } else {
      expect(tailorRes.ok()).toBeTruthy();
      await page.goto("/tailor-resume", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Resume Tailoring" })).toBeVisible({ timeout: 30_000 });
    }

    await context.close();
  });
});

