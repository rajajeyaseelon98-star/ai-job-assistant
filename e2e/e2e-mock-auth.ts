import type { BrowserContext } from "@playwright/test";
import { E2E_MOCK_DEFAULT_SECRET } from "../lib/e2e-auth";

export function e2eMockAuthSecret(): string {
  return E2E_MOCK_DEFAULT_SECRET;
}

function baseUrl(): string {
  return (
    process.env.PLAYWRIGHT_BASE_URL ??
    `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3010"}`
  );
}

/**
 * Sets cookies read by `lib/e2e-auth.ts` in **non-production** (`readE2eMockRoleFromCookies`).
 * Secret must match `E2E_MOCK_DEFAULT_SECRET` in `lib/e2e-auth.ts`.
 */
export async function applyE2eMockAuth(
  context: BrowserContext,
  role: "recruiter" | "job_seeker"
) {
  const url = baseUrl();
  const secret = e2eMockAuthSecret();
  await context.addCookies([
    { name: "e2e-mock-role", value: role, url },
    { name: "e2e-mock-secret", value: secret, url },
  ]);
}
