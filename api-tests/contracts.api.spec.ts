import { test, expect } from "@playwright/test";
import { asRole } from "./helpers/auth-context";

test.describe("API contract tests", () => {
  test("analyze-resume validation error includes retry metadata", async () => {
    const ctx = await asRole("job_seeker");
    const res = await ctx.post("/api/analyze-resume", {
      data: { resumeText: "" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
    expect(body.requestId).toBeTruthy();
    expect(body.retryable).toBe(false);
    await ctx.dispose();
  });

  test("messages bad payload includes structured error fields", async () => {
    const ctx = await asRole("job_seeker");
    const res = await ctx.post("/api/messages", {
      data: { receiver_id: "bad-id", content: "hi" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: expect.any(String),
      requestId: expect.any(String),
      retryable: false,
    });
    await ctx.dispose();
  });

  test("usage summary success contains meta envelope", async () => {
    const ctx = await asRole("job_seeker");
    const res = await ctx.get("/api/usage/summary");
    expect([200, 500]).toContain(res.status());
    const body = await res.json();
    if (res.status() === 200) {
      expect(body.meta?.requestId).toBeTruthy();
      expect(body.meta?.generatedAt).toBeTruthy();
    } else {
      expect(body.requestId).toBeTruthy();
      expect(typeof body.retryable).toBe("boolean");
    }
    await ctx.dispose();
  });

  test("recruiter optimize contract includes structured success/error", async () => {
    const ctx = await asRole("recruiter");
    const res = await ctx.post("/api/recruiter/jobs/not-a-uuid/optimize");
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "Invalid ID",
      requestId: expect.any(String),
      retryable: false,
    });
    await ctx.dispose();
  });

  test("auto-apply POST rejects missing resume_id", async () => {
    const ctx = await asRole("job_seeker");
    const res = await ctx.post("/api/auto-apply", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 429]).toContain(res.status());
    const body = await res.json();
    if (res.status() === 400) {
      expect(body.error).toBe("Valid resume_id is required");
    }
    await ctx.dispose();
  });

  test("generate-cover-letter POST rejects empty payload fields", async () => {
    const ctx = await asRole("job_seeker");
    const res = await ctx.post("/api/generate-cover-letter", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect([400, 429]).toContain(res.status());
    const body = await res.json();
    if (res.status() === 400) {
      expect(body.requestId).toBeTruthy();
      expect(body.retryable).toBe(false);
    }
    await ctx.dispose();
  });
});
