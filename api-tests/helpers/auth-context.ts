import { request, type APIRequestContext } from "@playwright/test";
import { E2E_MOCK_DEFAULT_SECRET } from "../../lib/e2e-auth";

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT ?? "3010"}`;

export async function asRole(role: "job_seeker" | "recruiter"): Promise<APIRequestContext> {
  const cookie = `e2e-mock-role=${role}; e2e-mock-secret=${E2E_MOCK_DEFAULT_SECRET}`;
  return request.newContext({
    baseURL,
    extraHTTPHeaders: {
      Cookie: cookie,
    },
  });
}
