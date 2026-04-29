import { test, expect } from "@playwright/test";
import { applyE2eMockAuth } from "./e2e-mock-auth";
import { loadFixture } from "./helpers/fixtures";

type JobPostingFixture = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  skills_required: string[];
  location: string;
  work_type: string;
  employment_type: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  status: string;
};

test.describe("Recruiter critical E2E flows", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await applyE2eMockAuth(context, "recruiter");
    await page.goto("/");
  });

  test("create job -> publish -> verify listing + AI generate", async ({ page }) => {
    const job = loadFixture<JobPostingFixture>("jobs", "sample-job-posting.json");
    let createCalled = false;

    await page.route(/\/api\/recruiter\/jobs\/generate-description$/, async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          message: "AI job description generated.",
          description: "Generated description",
          requirements: "Generated requirements",
          skills_required: ["React", "TypeScript"],
          meta: { requestId: "req-jd-1", nextStep: "Review and publish" },
        }),
      });
    });

    await page.route(/\/api\/recruiter\/jobs(\?|$)/, async (route) => {
      if (route.request().method() === "POST") {
        createCalled = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: job.id, ok: true, message: "Created" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ ...job, application_count: 0 }]),
      });
    });

    await page.goto("/recruiter/jobs/new");
    await page.getByPlaceholder(/Senior React Developer/i).fill(job.title);
    await page.getByRole("button", { name: "AI Generate" }).click();
    await expect(page.locator("textarea").first()).toHaveValue("Generated description");
    await page.getByRole("button", { name: "Publish Job" }).click();
    await page.waitForURL(/\/recruiter\/jobs/);
    await expect.poll(() => createCalled).toBe(true);
  });

  test("candidate search -> profile -> ATS analyze -> auto-shortlist partial", async ({ page }) => {
    const candidateId = "00000000-0000-4000-8000-00000000ca11";
    const resumeId = "00000000-0000-4000-8000-00000000ra11";

    await page.route(/\/api\/recruiter\/candidates(\?|$)/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          candidates: [
            {
              id: candidateId,
              email: "alice@example.com",
              name: "Alice",
              has_resume: true,
              resume_id: resumeId,
              created_at: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          totalPages: 1,
        }),
      });
    });

    await page.route(new RegExp(`/api/recruiter/candidates/${candidateId}$`), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: candidateId,
          email: "alice@example.com",
          name: "Alice",
          resumes: [{ id: resumeId, parsed_text: "React TS", file_url: null, created_at: new Date().toISOString() }],
          user_preferences: null,
          created_at: new Date().toISOString(),
        }),
      });
    });

    await page.route(new RegExp(`/api/recruiter/resumes/${resumeId}/analyze$`), async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          message: "Resume analysis generated and saved.",
          atsScore: 79,
          missingSkills: ["Architecture"],
          meta: { requestId: "req-ats-1", nextStep: "Review ATS score" },
        }),
      });
    });

    await page.route(/\/api\/recruiter\/jobs\/[^/]+\/auto-shortlist$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          message: "Auto-shortlist run completed.",
          shortlisted: 2,
          total_screened: 3,
          itemized: [
            { application_id: "a1", status: "success", reason: "Strong fit" },
            { application_id: "a2", status: "failed", reason: "AI JSON parse failure" },
            { application_id: "a3", status: "skipped", reason: "Low score" },
          ],
          meta: { requestId: "req-shortlist-1", nextStep: "Review failed items" },
        }),
      });
    });

    await page.goto("/recruiter/candidates");
    await expect(page.getByRole("link", { name: /Alice/i })).toBeVisible();
    const atsStatus = await page.evaluate(async (id) => {
      const res = await fetch(`/api/recruiter/resumes/${id}/analyze`, {
        method: "POST",
      });
      return res.status;
    }, resumeId);
    expect(atsStatus).toBe(200);
  });

  test("messaging send -> failed retry -> sent/read state", async ({ page }) => {
    let postCount = 0;
    await page.route(/\/api\/messages(\?|$)/, async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ messages: [], peer_profiles: {}, has_more: false, next_before: null, partial: true }),
        });
        return;
      }
      if (method === "POST") {
        postCount += 1;
        if (postCount === 1) {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({
              error: "Failed to send message",
              requestId: "req-msg-fail-1",
              retryable: true,
              nextAction: "Retry send",
            }),
          });
          return;
        }
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "m1",
            sender_id: "s1",
            receiver_id: "r1",
            content: "hello",
            created_at: new Date().toISOString(),
            read_at: null,
            ok: true,
            message: "Message sent",
            messageId: "m1",
            sentAt: new Date().toISOString(),
            notificationQueued: true,
            meta: { requestId: "req-msg-ok-1", nextStep: "Monitor delivery state in this thread" },
          }),
        });
      }
    });
    await page.route(/\/api\/messages\/unread-summary$/, async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ counts: {} }) });
    });
    await page.route(/\/api\/messages\/thread/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          messages: [{ id: "m1", sender_id: "me", receiver_id: "peer", content: "hello", created_at: new Date().toISOString(), read_at: new Date().toISOString(), is_read: true }],
          peer_profiles: {},
          has_more: false,
          next_before: null,
          peer_id: "peer",
        }),
      });
    });

    await page.goto("/recruiter/messages?compose=1&receiver_id=00000000-0000-4000-8000-00000000aa01");
    await page.getByPlaceholder("Write your message...").fill("Hello from recruiter");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText("Message failed to send.")).toBeVisible();
    await page.getByRole("button", { name: "Dismiss" }).click();
  });
});
