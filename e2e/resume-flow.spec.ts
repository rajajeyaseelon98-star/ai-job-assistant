import { test, expect } from "@playwright/test";
import { applyE2eMockAuth } from "./e2e-mock-auth";
import { loadTextFixture } from "./helpers/fixtures";
import { mockJsonPost } from "./helpers/network-mocks";

test.describe("Resume and AI job-seeker flows", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await applyE2eMockAuth(context, "job_seeker");
    await page.goto("/");
  });

  test("resume analyze -> improve -> re-analyze", async ({ page }) => {
    const resumeText = loadTextFixture("resumes", "sample-resume.txt");

    await mockJsonPost(page, /\/api\/analyze-resume$/, {
      ok: true,
      message: "Resume analysis generated.",
      atsScore: 72,
      missingSkills: ["Leadership", "System design"],
      resumeImprovements: ["Quantify impact", "Clarify ownership"],
      recommendedRoles: ["Frontend Engineer"],
      _usage: { used: 1, limit: 10 },
      meta: { requestId: "req-analyze-1", nextStep: "Improve resume" },
    });
    await mockJsonPost(page, /\/api\/improve-resume$/, {
      ok: true,
      message: "Improved resume generated.",
      summary: "Improved summary",
      skills: ["React", "TypeScript", "Leadership"],
      experience: [{ title: "Senior Frontend Engineer", company: "Acme", bullets: ["Improved UX"] }],
      projects: [],
      education: "B.Tech CSE",
      improvedResumeId: "imp-1",
      meta: { requestId: "req-improve-1", nextStep: "Re-check ATS score" },
    });

    await page.goto("/resume-analyzer");
    await page.getByRole("button", { name: "Paste resume text" }).click();
    await page.getByPlaceholder(/Paste your full resume here/i).fill(resumeText);
    await page.getByRole("button", { name: "Analyze resume" }).click();
    await expect(page.getByText("Resume analysis")).toBeVisible();

    await page.getByRole("button", { name: "Improve my resume" }).click();
    await expect(page.getByText("Improved resume")).toBeVisible();

    await page.getByRole("button", { name: /See your new ATS score/i }).click();
    await expect(page.getByText("Resume analysis")).toBeVisible();
  });

  test("job match + cover letter + auto job finder", async ({ page }) => {
    let coverLetterCalled = false;
    let autoJobsCalled = false;
    await mockJsonPost(page, /\/api\/job-match$/, {
      ok: true,
      message: "Job match generated.",
      match_score: 81,
      matched_skills: ["React", "TypeScript"],
      missing_skills: ["GraphQL"],
      resume_improvements: ["Add GraphQL project"],
      meta: { requestId: "req-match-1", nextStep: "Improve resume" },
    });
    await mockJsonPost(page, /\/api\/generate-cover-letter(\?|$)/, {
      ok: true,
      message: "Cover letter generated and saved.",
      id: "cl-1",
      coverLetter: "Dear Hiring Manager, ...",
      companyName: "Stub Corp",
      jobTitle: "Frontend Engineer",
      createdAt: new Date().toISOString(),
      meta: {
        savedId: "cl-1",
        savedAt: new Date().toISOString(),
        requestId: "req-cover-1",
        nextStep: "Open history",
      },
    });
    await page.route(/\/api\/generate-cover-letter(\?|$)/, async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      coverLetterCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
      ok: true,
      message: "Cover letter generated and saved.",
      id: "cl-1",
      coverLetter: "Dear Hiring Manager, ...",
      companyName: "Stub Corp",
      jobTitle: "Frontend Engineer",
      createdAt: new Date().toISOString(),
      meta: {
        savedId: "cl-1",
        savedAt: new Date().toISOString(),
        requestId: "req-cover-1",
        nextStep: "Open history",
      },
        }),
      });
    });
    await page.route(/\/api\/auto-jobs$/, async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      autoJobsCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          message: "Jobs generated from resume.",
          id: "search-1",
          skills: { technical: ["React"], soft: ["Communication"], tools: ["Git"], preferred_roles: ["Frontend Engineer"], industries: ["Tech"] },
          jobs: [{ id: "j1", title: "Frontend Engineer", company: "Stub Corp", location: "Remote", description: "desc", source: "AI Suggested", match_reason: "Strong fit" }],
          search_query: "Frontend Engineer",
          total: 1,
          meta: { requestId: "req-jobs-1", nextStep: "Review jobs and apply" },
        }),
      });
    });

    await page.goto("/job-match");
    await page.getByPlaceholder(/Paste your resume text/i).fill("React TS resume");
    await page.getByPlaceholder(/Paste the job description/i).fill("Need React TS");
    await page.getByRole("button", { name: /Match resume/i }).first().click();
    await expect(page.getByRole("heading", { name: "Match result" })).toBeVisible();

    await page.goto("/cover-letter");
    await page.evaluate(async () => {
      await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Stub Corp",
          jobTitle: "Frontend Engineer",
          jobDescription: "Need React + TS",
          resumeText: "React TS resume",
        }),
      });
    });
    await expect.poll(() => coverLetterCalled).toBe(true);

    await page.goto("/job-finder");
    await page.evaluate(async () => {
      await fetch("/api/auto-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: "React TS resume",
        }),
      });
    });
    await expect.poll(() => autoJobsCalled).toBe(true);
  });

  test("credit exhaustion returns 402 and shows upgrade CTA", async ({ page }) => {
    await mockJsonPost(
      page,
      /\/api\/analyze-resume$/,
      {
        error: "CREDITS_EXHAUSTED",
        message: "You have reached your AI credit limit. Please upgrade.",
        requestId: "req-credits-1",
        retryable: false,
        nextAction: "Upgrade plan",
      },
      402
    );

    await page.goto("/resume-analyzer");
    await page.getByRole("button", { name: "Paste resume text" }).click();
    await page.getByPlaceholder(/Paste your full resume here/i).fill("Sample resume");
    await page.getByRole("button", { name: "Analyze resume" }).click();
    await expect(page.getByText(/credit limit/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Upgrade/i }).first()).toBeVisible();
  });
});
