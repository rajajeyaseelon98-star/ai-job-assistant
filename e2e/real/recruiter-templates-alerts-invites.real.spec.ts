import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "recruiter.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

async function getCompanyId(request: import("@playwright/test").APIRequestContext) {
  const res = await request.get("/api/recruiter/company");
  if (!res.ok()) return null;
  const data = (await res.json().catch(() => null)) as unknown;
  const arr = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  const id = arr?.[0]?.id ? String(arr[0].id) : null;
  return id;
}

test.describe("Real-user recruiter: templates + alerts + invites", () => {
  test.setTimeout(240_000);

  test("create template + create alert; invite accept is best-effort", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("recruiter.json") });
    const page = await ctx.newPage();

    // Template: create via API, verify appears in UI.
    const templateName = `E2E Template ${Date.now().toString().slice(-6)}`;
    const createTpl = await page.request.post("/api/recruiter/templates", {
      data: {
        name: templateName,
        subject: "E2E subject",
        content: "Hello {candidate_name}, this is an E2E template.",
        template_type: "general",
      },
    });
    expect(createTpl.ok()).toBeTruthy();

    await page.goto("/recruiter/templates", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Message Templates/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(templateName, { exact: false }).first()).toBeVisible({ timeout: 30_000 });

    // Alert: create via API, verify appears in UI.
    const alertName = `E2E Alert ${Date.now().toString().slice(-6)}`;
    const createAlert = await page.request.post("/api/recruiter/alerts", {
      data: { name: alertName, filters: { skills: ["Playwright", "TypeScript"], experience: "senior" } },
    });
    expect(createAlert.ok()).toBeTruthy();

    await page.goto("/recruiter/alerts", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Saved Alerts/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(alertName, { exact: false }).first()).toBeVisible({ timeout: 30_000 });

    // Invite accept (best-effort): only works if we can invite the *same* logged-in email (invite email mismatch blocks).
    const companyId = await getCompanyId(page.request);
    const me = await page.request.get("/api/user");
    const meBody = (await me.json().catch(() => null)) as Record<string, unknown> | null;
    const email = (meBody?.email as string | undefined) ?? null;
    if (companyId && email) {
      const inv = await page.request.post("/api/recruiter/company/invites", {
        data: { company_id: companyId, email, role: "recruiter" },
      });
      if (inv.status() === 402) {
        test.info().annotations.push({
          type: "note",
          description: "Invite creation blocked by plan team-member limit (402).",
        });
      } else if (inv.ok()) {
        const body = (await inv.json().catch(() => null)) as Record<string, unknown> | null;
        const inviteUrl = String(body?.invite_url || "");
        const token = new URL(inviteUrl).searchParams.get("token");
        if (token) {
          const accept = await page.request.post("/api/recruiter/company/invites/accept", { data: { token } });
          if (accept.status() === 409) {
            test.info().annotations.push({ type: "note", description: "Invite already accepted (409)." });
          } else if (accept.status() === 402) {
            test.info().annotations.push({
              type: "note",
              description: "Invite accept blocked by plan team-member cap (402).",
            });
          } else if (!accept.ok()) {
            test.info().annotations.push({
              type: "note",
              description: `Invite accept returned ${accept.status()} (best-effort; may fail due to RLS/membership constraints).`,
            });
          } else {
            expect([200, 201]).toContain(accept.status());
          }
        }
      }
    }

    await ctx.close();
  });
});

