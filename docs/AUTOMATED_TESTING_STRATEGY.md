# Automated Testing Strategy

**Last updated:** 2026-05-02 (Full inventory API/page smoke + `docs/QA_FULL_SITE_COVERAGE.md` + `docs/QA_CHANGE_CHECKLIST.md`)

## Scope

This strategy adds deterministic automation for:

- Job seeker high-risk flows
- Recruiter high-risk flows
- AI-credit and retry/error UX behavior
- API contract and data-integrity checks

## Test Architecture

- **E2E:** Playwright UI tests under `e2e/`
- **API tests:** Playwright API-only specs under `api-tests/`
- **Fixtures:** Deterministic test payloads under `fixtures/`
- **Seed helper:** `scripts/test/seed-fixtures.mjs` emits SQL for stable seeded environments

**Inventory-complete automation (Layer A):** See **`docs/QA_FULL_SITE_COVERAGE.md`**. API smoke lives in **`api-tests/inventory-get-smoke.api.spec.ts`** and **`api-tests/inventory-mutations-smoke.api.spec.ts`**; all pages from **`docs/QA_ROUTE_INVENTORY.md`** are visited by **`e2e/full-site-page-inventory-mock.spec.ts`**. When you add routes, follow **`docs/QA_CHANGE_CHECKLIST.md`**.

## Folder Structure

- `e2e/`
  - `resume-flow.spec.ts`
  - `auto-apply.spec.ts`
  - `recruiter-flow.spec.ts`
  - `helpers/fixtures.ts`
  - `helpers/network-mocks.ts`
- `api-tests/`
  - `contracts.api.spec.ts`
  - `data-integrity.api.spec.ts`
  - `inventory-get-smoke.api.spec.ts`
  - `inventory-mutations-smoke.api.spec.ts`
  - `helpers/auth-context.ts`
- `fixtures/`
  - `users.json`
  - `resumes/sample-resume.txt`
  - `jobs/sample-job-posting.json`

## Deterministic AI Mock Strategy

- Route-stub AI endpoints in Playwright specs (`page.route`) to avoid flaky provider/network behavior.
- Keep mocked payloads aligned to production response contracts (`ok`, `message`, `meta.requestId`, error `retryable/nextAction`).
- Use explicit URL regex (not loose globs) to avoid intercepting wrong routes.
- For live integration runs, disable route mocks and use seeded fixtures + test credits.

## Provider fallback testing guidance (Gemini → Groq → OpenAI)

- Keep **provider fallback** unit-tested at the `lib/ai.ts` boundary with mocked fetch responses (503/429/quota).
- In Playwright E2E, prefer **one stable “AI mocked” mode** for PRs and **one scheduled “live integration” mode** with small prompts and strict spend limits.

## Critical E2E Coverage

### Job seeker

- Resume Analyze -> Improve -> Re-analyze
- Job Match flow
- Cover Letter generation
- Auto Job Finder flow
- Auto Apply:
  - Full success
  - Partial failure
  - Retry failed subset
- Smart Apply:
  - Rule creation
  - Triggered execution state handling
- Credit exhaustion UX (HTTP 402 with upgrade CTA)

### Recruiter

- Create job -> publish -> list verification
- AI generate job description
- Candidate search -> profile
- Candidate ATS analysis
- Auto-shortlist partial-failure result contract
- Messaging send/failure/retry state handling

## API Contract Coverage

- Structured validation errors include `requestId`, `retryable`, and actionable metadata.
- Success/error envelope checks for usage and recruiter optimize routes.
- Contract checks run through cookie-based mock auth request contexts.

## Email delivery: webhook + cron coverage

- **Webhook contract tests:** add API-only specs that:
  - send `POST /api/webhooks/resend` with **valid** Svix signature headers (fixture secret) and verify a 200 response
  - send with invalid/missing signature and verify 401/400 response (depending on implementation)
- **Cron auth tests:** add API-only specs for `GET /api/internal/email-retry` that assert:
  - missing `Authorization` -> 401
  - `Authorization: Bearer <CRON_SECRET>` -> 200 (in test env with secret configured)

Note: database assertions for `email_logs`/`email_job_runs` should be done with service-role test helpers (never via end-user RLS paths).

## Data Integrity Coverage

- Idempotent mark-read behavior
- Safe auto-apply confirm contract path checks under non-seeded/seeded envs
- Retry-safe assertions (no hard dependency on row order or non-deterministic timestamps)

## Runbook

1. Install browser once:
   - `npx playwright install chromium`
2. Run critical E2E flows:
   - `npm run test:e2e:critical`
3. Run API contract/data-integrity suite:
   - `npm run test:api`
4. Run full QA automation:
   - `npm run test:all:qa`
5. Optional: generate SQL seed statements:
   - `node scripts/test/seed-fixtures.mjs`

## CI Guidance

- Keep AI calls mocked in PR pipeline.
- Run at least one nightly job with seeded live API mode for integration confidence.
- Publish Playwright HTML report artifacts for failed runs.
