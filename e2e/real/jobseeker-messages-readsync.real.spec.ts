import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user jobseeker messages read sync", () => {
  test.setTimeout(180_000);

  test("open a thread and mark unread as read (best-effort)", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");
    const ctx = await browser.newContext({ baseURL, storageState: authStatePath("jobseeker.json") });
    const page = await ctx.newPage();

    // Pre-check unread counts (may be empty).
    const before = await page.request.get("/api/messages/unread-summary");
    expect(before.ok()).toBeTruthy();
    const beforeBody = (await before.json().catch(() => null)) as { counts?: Record<string, number> } | null;
    const counts = beforeBody?.counts ?? {};
    const unreadPeerId = Object.entries(counts).find(([, c]) => (c ?? 0) > 0)?.[0] ?? null;

    if (!unreadPeerId) {
      test.info().annotations.push({ type: "note", description: "No unread messages; read-sync is best-effort." });
      await page.goto("/messages", { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
      await ctx.close();
      return;
    }

    await page.goto(`/messages?peer=${encodeURIComponent(unreadPeerId)}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible({ timeout: 30_000 });

    // Wait for mark-read call and then confirm via API that this peer count dropped to 0.
    await page.waitForResponse((r) => r.url().includes("/api/messages/mark-read") && r.request().method() === "POST", {
      timeout: 60_000,
    });

    let cleared = false;
    for (let i = 0; i < 10; i++) {
      const after = await page.request.get("/api/messages/unread-summary");
      if (!after.ok()) break;
      const afterBody = (await after.json().catch(() => null)) as { counts?: Record<string, number> } | null;
      const c = afterBody?.counts?.[unreadPeerId] ?? 0;
      if (c === 0) {
        cleared = true;
        break;
      }
      await page.waitForTimeout(750);
    }
    expect(cleared).toBeTruthy();

    await ctx.close();
  });
});

