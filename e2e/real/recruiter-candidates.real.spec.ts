import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json" | "recruiter.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

type CandidatesSearchResponse = {
  candidates: Array<{ id: string }>;
  total?: number;
};

test.describe("Real-user recruiter candidates flow", () => {
  test.setTimeout(180_000);

  test("search → open candidate profile → (best-effort) run ATS analysis", async ({
    browser,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");

    const recruiterContext = await browser.newContext({
      baseURL,
      storageState: authStatePath("recruiter.json"),
    });
    const page = await recruiterContext.newPage();

    // Find a real candidate id via API. If there are no candidates (fresh DB), skip.
    const sp = new URLSearchParams();
    sp.set("page", "1");
    sp.set("pageSize", "10");
    const listRes = await page.request.get(`/api/recruiter/candidates?${sp.toString()}`);
    expect(listRes.ok()).toBeTruthy();
    const listBody = (await listRes.json().catch(() => null)) as CandidatesSearchResponse | null;
    const candidateId = listBody?.candidates?.[0]?.id ?? null;
    if (!candidateId) {
      test.info().annotations.push({
        type: "note",
        description:
          "Skipped recruiter candidate profile: /api/recruiter/candidates returned no candidates for this recruiter account.",
      });
      await recruiterContext.close();
      return;
    }

    // Open candidate profile page.
    await page.goto(`/recruiter/candidates/${encodeURIComponent(candidateId)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });

    // Best-effort: run ATS analysis if the candidate has a resume with extracted text.
    // This may be blocked by AI credits/plan limits; do not fail the whole suite for that.
    const atsBtn = page.getByRole("button", { name: /Run ATS analysis/i }).first();
    if (await atsBtn.isVisible().catch(() => false)) {
      await atsBtn.click();
      // Either we see "Analysis saved." toast/status OR we hit a credit exhausted UI.
      const saved = page.getByText(/Analysis saved/i).first();
      const credit = page.getByText(/credit limit/i).first();
      await expect(saved.or(credit)).toBeVisible({ timeout: 60_000 });
    } else {
      test.info().annotations.push({
        type: "note",
        description:
          "Candidate profile loaded but no 'Run ATS analysis' action was available (likely no resume parsed_text).",
      });
    }

    await recruiterContext.close();
  });
});

