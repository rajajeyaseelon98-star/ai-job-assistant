import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "recruiter.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user recruiter job edit (dynamic :id page)", () => {
  test.setTimeout(240_000);

  test("create job via API → edit via UI → verify via API", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("recruiter.json") });
    const page = await ctx.newPage();

    const suffix = Date.now().toString().slice(-6);
    const title = `E2E Edit Job ${suffix}`;

    const create = await page.request.post("/api/recruiter/jobs", {
      data: {
        title,
        description: "E2E job used to verify recruiter edit page (/recruiter/jobs/:id).",
        requirements: "E2E requirements",
        skills_required: ["Playwright", "TypeScript"],
        location: "Remote",
        work_type: "remote",
        employment_type: "full_time",
        status: "draft",
      },
    });
    expect(create.ok()).toBeTruthy();
    const created = (await create.json().catch(() => null)) as { id?: string } | null;
    const jobId = created?.id ?? null;
    expect(jobId).toBeTruthy();

    await page.goto(`/recruiter/jobs/${encodeURIComponent(jobId!)}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Edit Job Posting/i })).toBeVisible({ timeout: 30_000 });

    const newTitle = `${title} (updated)`;
    await page.getByPlaceholder("e.g., Senior React Developer").first().fill(newTitle);
    await page.getByRole("button", { name: "Save Changes", exact: true }).click();

    // Receipt card appears on success.
    await expect(page.getByText(/Job changes saved/i)).toBeVisible({ timeout: 60_000 });

    const verify = await page.request.get(`/api/recruiter/jobs/${encodeURIComponent(jobId!)}`);
    expect(verify.ok()).toBeTruthy();
    const row = (await verify.json().catch(() => null)) as { title?: string } | null;
    expect(row?.title).toBe(newTitle);

    await ctx.close();
  });
});

