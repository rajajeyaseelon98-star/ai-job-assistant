import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json" | "recruiter.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing env var: ${name}`);
  return v.trim();
}

type RecipientRow = { id: string; name: string | null; email: string; role: string };

async function findRecipientIdByEmail(opts: {
  page: import("@playwright/test").Page;
  email: string;
}) {
  const { page, email } = opts;
  const q = email.slice(0, 3);
  const res = await page.request.get(`/api/messages/recipient-search?q=${encodeURIComponent(q)}`);
  expect(res.ok()).toBeTruthy();
  const body = (await res.json().catch(() => null)) as { results?: RecipientRow[] } | null;
  const rows = body?.results ?? [];
  const match = rows.find((r) => r.email?.toLowerCase() === email.toLowerCase());
  if (!match) {
    throw new Error(`Recipient not found in /api/messages/recipient-search for ${email}. Got ${rows.length} results.`);
  }
  return match.id;
}

test.describe("Real-user messaging (recruiter ↔ jobseeker)", () => {
  test.setTimeout(180_000);

  test("recruiter sends message → jobseeker sees it in Messages UI", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");

    const recruiterEmail = requireEnv("E2E_RECRUITER_EMAIL");
    const jobseekerEmail = requireEnv("E2E_JOBSEEKER_EMAIL");

    const recruiterContext = await browser.newContext({
      baseURL,
      storageState: authStatePath("recruiter.json"),
    });
    const jobseekerContext = await browser.newContext({
      baseURL,
      storageState: authStatePath("jobseeker.json"),
    });

    const recruiterPage = await recruiterContext.newPage();
    const jobseekerPage = await jobseekerContext.newPage();

    // Resolve the peer user IDs via recipient search (rate-limited but OK for a single query).
    const jobseekerId = await findRecipientIdByEmail({ page: recruiterPage, email: jobseekerEmail });
    const recruiterId = await findRecipientIdByEmail({ page: jobseekerPage, email: recruiterEmail });

    const stamp = Date.now().toString().slice(-6);
    const subject = `E2E message ${stamp}`;
    const content = `Hello from recruiter (${stamp}) — Playwright real-user messaging coverage.`;

    // Send message via API for stability, verify via UI.
    const sendRes = await recruiterPage.request.post("/api/messages", {
      data: { receiver_id: jobseekerId, subject, content },
    });
    expect(sendRes.ok()).toBeTruthy();

    await recruiterPage.goto(`/recruiter/messages?peer=${encodeURIComponent(jobseekerId)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(recruiterPage.getByRole("heading", { name: "Inbox" })).toBeVisible({ timeout: 30_000 });
    await expect(recruiterPage.getByText(content, { exact: false }).first()).toBeVisible({ timeout: 30_000 });

    await jobseekerPage.goto(`/messages?peer=${encodeURIComponent(recruiterId)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(jobseekerPage.getByRole("heading", { name: "Inbox" })).toBeVisible({ timeout: 30_000 });
    await expect(jobseekerPage.getByText(content, { exact: false }).first()).toBeVisible({ timeout: 30_000 });

    await recruiterContext.close();
    await jobseekerContext.close();
  });
});

