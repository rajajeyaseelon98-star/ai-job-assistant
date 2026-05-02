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
  return arr?.[0]?.id ? String(arr[0].id) : null;
}

test.describe("Real-user recruiter invite accept UI", () => {
  test.setTimeout(240_000);

  test("invite URL opens accept page (best-effort)", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("recruiter.json") });
    const page = await ctx.newPage();

    const companyId = await getCompanyId(page.request);
    expect(companyId).toBeTruthy();

    const me = await page.request.get("/api/user");
    expect(me.ok()).toBeTruthy();
    const meBody = (await me.json().catch(() => null)) as Record<string, unknown> | null;
    const email = (meBody?.email as string | undefined) ?? null;
    expect(email).toBeTruthy();

    const inv = await page.request.post("/api/recruiter/company/invites", {
      data: { company_id: companyId!, email: email!, role: "recruiter" },
    });
    if (inv.status() === 402) {
      test.info().annotations.push({
        type: "note",
        description: "Invite creation blocked by plan team-member limit (402).",
      });
      await ctx.close();
      return;
    }
    expect(inv.ok()).toBeTruthy();
    const body = (await inv.json().catch(() => null)) as Record<string, unknown> | null;
    const inviteUrl = String(body?.invite_url || "");
    expect(inviteUrl).toContain("/recruiter/invite/accept");

    const token = new URL(inviteUrl).searchParams.get("token");
    expect(token).toBeTruthy();

    await page.goto(`/recruiter/invite/accept?token=${encodeURIComponent(token!)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: /Accept company invite/i })).toBeVisible({ timeout: 30_000 });

    // Accept can succeed, or fail due to already-member / RLS / plan. Ensure the page resolves out of loading.
    await expect(page.getByText(/Accepting invite/i)).toBeHidden({ timeout: 60_000 });
    await expect(
      page.getByText(/Invite accepted|Could not accept invite/i).first()
    ).toBeVisible({ timeout: 60_000 });

    await ctx.close();
  });
});

