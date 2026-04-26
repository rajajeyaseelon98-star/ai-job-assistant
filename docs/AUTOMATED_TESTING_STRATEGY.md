# Automated Testing Strategy

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
