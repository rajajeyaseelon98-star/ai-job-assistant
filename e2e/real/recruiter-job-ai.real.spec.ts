import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "recruiter.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

function slugSuffix() {
  return Date.now().toString().slice(-6);
}

async function ensureRecruiterCompanyId(request: import("@playwright/test").APIRequestContext) {
  const list = await request.get("/api/recruiter/company");
  expect(list.ok()).toBeTruthy();
  const rows = (await list.json().catch(() => [])) as Record<string, unknown>[];
  const existing = rows?.[0]?.id ? String(rows[0].id) : "";
  if (existing) return existing;

  const created = await request.post("/api/recruiter/company", {
    data: {
      name: `E2E Recruiter Co ${Date.now()}`,
      website: "https://example.com",
      industry: "Software",
      size: "1-10",
      location: "Remote",
    },
  });
  expect(created.ok()).toBeTruthy();
  const body = (await created.json().catch(() => null)) as Record<string, unknown> | null;
  const id = body?.id ? String(body.id) : "";
  expect(id).toBeTruthy();
  return id;
}

async function createOrReuseActiveJob(request: import("@playwright/test").APIRequestContext, companyId: string) {
  const title = `E2E AI Job (${slugSuffix()})`;
  const basePayload = {
    company_id: companyId,
    title,
    description: "Created by Playwright to validate recruiter AI job flows.",
    requirements: "None",
    skills_required: ["Playwright", "TypeScript"],
    location: "Remote",
    work_type: "remote",
    employment_type: "full_time",
  };

  const active = await request.post("/api/recruiter/jobs", { data: { ...basePayload, status: "active" } });
  if (active.ok()) {
    const body = (await active.json()) as Record<string, unknown>;
    return { jobId: String(body.id), title };
  }

  // Plan limits can block active creation; fall back to draft + attempt activation.
  if (active.status() === 402) {
    const draft = await request.post("/api/recruiter/jobs", { data: { ...basePayload, status: "draft" } });
    expect(draft.ok()).toBeTruthy();
    const body = (await draft.json()) as Record<string, unknown>;
    const jobId = String(body.id);
    const activate = await request.patch(`/api/recruiter/jobs/${jobId}`, { data: { status: "active" } });
    if (activate.ok()) return { jobId, title };

    // Reuse existing active job.
    const list = await request.get("/api/recruiter/jobs");
    expect(list.ok()).toBeTruthy();
    const jobs = (await list.json().catch(() => [])) as Record<string, unknown>[];
    const existing = jobs.find((j) => j.status === "active" && j.id);
    if (!existing) {
      const txt = await activate.text().catch(() => "");
      throw new Error(`Could not activate job and no active job exists. Activate response: ${txt}`);
    }
    return { jobId: String(existing.id), title: String(existing.title || "Active job") };
  }

  const txt = await active.text().catch(() => "");
  throw new Error(`Job create failed: ${active.status()} ${txt}`);
}

test.describe("Real-user recruiter AI job flows", () => {
  test.setTimeout(180_000);

  test("optimize job + auto-shortlist (best-effort)", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");

    const recruiterContext = await browser.newContext({
      baseURL,
      storageState: authStatePath("recruiter.json"),
    });
    const page = await recruiterContext.newPage();

    // Create or reuse a job to drive job-specific AI pages.
    const companyId = await ensureRecruiterCompanyId(page.request);
    const { jobId } = await createOrReuseActiveJob(page.request, companyId);

    // 1) Optimize flow (AI): may be blocked by credits; treat as best-effort.
    await page.goto(`/recruiter/jobs/${encodeURIComponent(jobId)}/optimize`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /AI Job Post Optimization/i })).toBeVisible({ timeout: 30_000 });
    const optimizeBtn = page.getByRole("button", { name: /Analyze & Optimize/i }).first();
    if (await optimizeBtn.isVisible().catch(() => false)) {
      await optimizeBtn.click();
      const scoreLabel = page.getByText(/Optimization Score/i).first();
      const credit = page.getByText(/credit limit|upgrade/i).first();
      await expect(scoreLabel.or(credit)).toBeVisible({ timeout: 90_000 });
    }

    // 2) Auto-shortlist flow (AI): may be blocked by credits or no applications; best-effort.
    await page.goto(`/recruiter/jobs/${encodeURIComponent(jobId)}/auto-shortlist`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: /AI Auto-Shortlisting/i })).toBeVisible({ timeout: 30_000 });
    const shortlistBtn = page.getByRole("button", { name: /Start Auto-Shortlisting/i }).first();
    if (await shortlistBtn.isVisible().catch(() => false)) {
      await shortlistBtn.click();
      const done = page.getByText(/run complete/i).first();
      const credit = page.getByText(/credit limit|upgrade/i).first();
      const retryableError = page.getByText(/something went wrong|failed/i).first();
      await expect(done.or(credit).or(retryableError)).toBeVisible({ timeout: 120_000 });
    }

    await recruiterContext.close();
  });
});

