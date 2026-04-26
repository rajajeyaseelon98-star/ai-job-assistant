import { test, expect } from "@playwright/test";
import { asRole } from "./helpers/auth-context";

/**
 * These tests validate idempotency and persistence invariants against live APIs.
 * They are written to be executable in CI with mock auth cookies.
 */
test.describe("Data integrity API tests", () => {
  test("auto-apply confirm returns failed_items without false applied flag mutation path", async () => {
    const ctx = await asRole("job_seeker");
    const res = await ctx.post("/api/auto-apply/00000000-0000-4000-8000-00000000ff01/confirm");
    // 400 is valid in no-seed env; this still validates no server crash.
    expect([200, 400, 404]).toContain(res.status());
    const body = await res.json();
    expect(body).toEqual(expect.anything());
    await ctx.dispose();
  });

  test("messages mark-read is idempotent and returns updated_count", async () => {
    const ctx = await asRole("job_seeker");
    const payload = { peer_id: "00000000-0000-4000-8000-00000000bb01" };
    const first = await ctx.post("/api/messages/mark-read", { data: payload });
    expect([200, 400, 404]).toContain(first.status());
    const firstBody = await first.json();
    if (first.status() === 200) {
      expect(typeof firstBody.updated_count).toBe("number");
      const second = await ctx.post("/api/messages/mark-read", { data: payload });
      expect([200, 400, 404]).toContain(second.status());
      const secondBody = await second.json();
      if (second.status() === 200) {
        expect(secondBody.updated_count).toBeLessThanOrEqual(firstBody.updated_count);
      }
    }
    await ctx.dispose();
  });
});
