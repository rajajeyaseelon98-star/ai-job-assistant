import type { Page } from "@playwright/test";
import { mockJsonPost } from "./network-mocks";

/** Minimal ATS-shaped payload for stable assertions when mocking `POST /api/analyze-resume`. */
export const MOCK_ANALYZE_RESUME_RESPONSE = {
  ok: true,
  message: "Resume analysis generated.",
  atsScore: 72,
  missingSkills: ["Leadership"],
  resumeImprovements: ["Quantify impact"],
  recommendedRoles: ["Software Engineer"],
  _usage: { used: 1, limit: 10 },
} as const;

/** Use in deterministic specs when UI expects improved resume output metadata only. */
export const MOCK_IMPROVE_RESUME_RESPONSE = {
  ok: true,
  improvedResumeId: "00000000-0000-4000-8000-00000000feed",
  message: "Improvements applied.",
  meta: { requestId: "mock-req", savedAt: new Date().toISOString() },
} as const;

/** Install common AI POST mocks for job-seeker flows (extend per spec as needed). */
export async function mockDeterministicAiPosts(page: Page) {
  await mockJsonPost(page, /\/api\/analyze-resume$/, MOCK_ANALYZE_RESUME_RESPONSE);
  await mockJsonPost(page, /\/api\/improve-resume$/, MOCK_IMPROVE_RESUME_RESPONSE);
}
