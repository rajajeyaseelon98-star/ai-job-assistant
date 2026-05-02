import { test, expect } from "@playwright/test";
import path from "node:path";

function authStatePath(fileName: "jobseeker.json") {
  return path.join(process.cwd(), "playwright", ".auth", fileName);
}

test.describe("Real-user jobseeker: LinkedIn import (best-effort)", () => {
  test.setTimeout(180_000);

  test("page loads; API accepts sample profile text", async ({ browser, baseURL }) => {
    if (!baseURL) throw new Error("Missing baseURL in Playwright config.");

    const context = await browser.newContext({
      baseURL,
      storageState: authStatePath("jobseeker.json"),
    });
    const page = await context.newPage();

    await page.goto("/import-linkedin", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "LinkedIn Import" })).toBeVisible({ timeout: 30_000 });

    const sample =
      "John Doe\nSoftware Engineer\nExperience: Built web apps with React and TypeScript.\nEducation: B.Tech 2022.\nSkills: React, TypeScript, Playwright.\n";

    const res = await page.request.post("/api/import-linkedin", { data: { profileText: sample.repeat(2) } });
    if (res.status() === 402) {
      test.info().annotations.push({
        type: "note",
        description: "LinkedIn import blocked due to AI credits exhausted (402).",
      });
    } else {
      expect(res.ok()).toBeTruthy();
      const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      expect(body && typeof body === "object").toBeTruthy();
      // Validate minimal shape exists.
      expect(Array.isArray(body?.skills)).toBeTruthy();
    }

    await context.close();
  });
});

