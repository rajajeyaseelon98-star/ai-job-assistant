# Full E2E QA Plan (Playwright) — Option A + Option B

**App:** AI Job Assistant (jobseeker + recruiter marketplace)  
**Stack:** Next.js App Router, Supabase Auth + Postgres, SSR + client interactions  
**Goal:** Validate the **complete marketplace lifecycle** + **critical AI flows** with high confidence, without breaking existing suites.

## Constraints (hard rules)

- **Do not modify backend business logic** (no changes to API contracts, DB logic, RLS, or production behavior).
- **Do not break existing tests** (`npm run test:all:qa` must remain green).
- **Selectors:** prefer **`data-testid`** on critical actions; otherwise use **role/label selectors** (`getByRole`, `getByLabel`) and **URL assertions**.
- **Deterministic + CI-safe:** anything that runs in CI must not rely on real accounts, real external providers, or mutable production data.
- **Reuse sessions:** real-user projects must reuse Playwright `storageState` (no re-login per test).

## Why two options

“Full end-to-end real-user coverage” and “deterministic CI-safe” are in tension:

- **Real-user flows** are higher confidence but can drift (data changes, rate limits, provider latency).
- **Deterministic flows** are CI-safe but cannot fully emulate “real” external behavior.

So we implement both, **one-by-one**:

- **Option A (Real-user regression / release gate):** deep confidence, run locally or scheduled.
- **Option B (Deterministic CI-safe):** stable PR gate, runs on every PR.

---

## Existing repo baseline (must stay green)

- E2E: `e2e/**`
- API tests: `api-tests/**`
- CI-safe QA command: `npm run test:all:qa` (critical E2E + API contract/data-integrity)

---

## Option A — Real-user full lifecycle (release gate)

### Objective (Option A)

Validate the **complete marketplace loop** using **real recruiter + real jobseeker credentials**, across **desktop + mobile**, with guardrails for stability.

### Authentication & session reuse

- Setup project logs in once per role and writes:
  - `playwright/.auth/jobseeker.json`
  - `playwright/.auth/recruiter.json`
- Dependent projects reuse those states.

**Required env (local only, gitignored):**

- `E2E_JOBSEEKER_EMAIL`, `E2E_JOBSEEKER_PASSWORD`
- `E2E_RECRUITER_EMAIL`, `E2E_RECRUITER_PASSWORD`
- `PLAYWRIGHT_BASE_URL` recommended: `http://localhost:3010`

**Optional:** `E2E_INTERNAL_AUTH_SECRET` to enable a stable dev-only internal login helper.

### Spec list (Option A)

- `e2e/real/marketplace.real.spec.ts`
  - Recruiter: create/publish job (UI or API-assisted)
  - Jobseeker: find job + apply (UI or API-assisted)
  - Recruiter: open applications + change stage to shortlisted + add note
  - Jobseeker: verify stage updated + persisted after reload
  - Health assertions: no console errors, no 4xx/5xx (allowlist if needed), no page crash.

- `e2e/real/jobseeker-ai.real.spec.ts`
  - Resume analyzer (paste or upload), improve, job match
  - Assert output exists (no empty states), avoid exact text matching.

- `e2e/real/recruiter.real.spec.ts`
  - Dashboard / jobs / applications load (already exists; expand to pipeline transitions as stable).

- `e2e/real/ui-stability.real.spec.ts`
  - Route sweep for both roles:
    - no console errors
    - no failed network requests (report failures)
    - no horizontal overflow at 375×812
    - primary heading/CTA visible

### Viewports

- **Desktop:** standard desktop chromium
- **Mobile:** Chromium **mobile emulation** (375×812) — avoids requiring WebKit install.

### Reliability rules (Option A)

- **Idempotency:** create uniquely named records (job title suffix) so reruns don’t collide.
- **Avoid brittle AI assertions:** validate “output exists” + basic structure; never assert exact model text.
- **Fail fast on auth:** if storageState invalid, fail with clear error, don’t silently loop.

### How to run (Option A)

- Setup + full run:
  - `npm run test:e2e:real:smoke`
  - (Expanded suite) `playwright test --project=real-setup --project=real-jobseeker-desktop --project=real-recruiter-desktop --project=real-jobseeker-mobile --project=real-recruiter-mobile`

---

## Option B — Deterministic CI-safe “full coverage” (PR gate)

### Objective (Option B)

Cover the same lifecycle and key UX invariants, but **without real credentials** and without dependence on external providers.

### Authentication

Use existing cookie-based mock auth helper (`e2e/e2e-mock-auth.ts`):

- `applyE2eMockAuth(context, "job_seeker")`
- `applyE2eMockAuth(context, "recruiter")`

### Spec list (Option B)

- `e2e/marketplace-full-flow.spec.ts` (deterministic)
  - recruiter creates job (via UI)
  - jobseeker applies (via UI)
  - recruiter updates stage + note (via UI)
  - jobseeker sees updates (via UI)
  - assert persistence across reload

- `e2e/resume-builder-flow.spec.ts` (deterministic)
  - `/resume-builder` fill required fields
  - “Open in Resume Analyzer”
  - analyze + improve + re-analyze (assert outputs exist / score appears)

- `e2e/jobseeker-ai.spec.ts` (deterministic)
  - analyze/improve/job match/tailor resume entry points (assert no crashes + outputs exist)

- `e2e/recruiter-flow.spec.ts` (already exists, keep green)
- `e2e/ui-stability.spec.ts` (deterministic route sweep)

### Determinism rules (Option B)

- Prefer fixtures and stable seeded data when possible.
- Never depend on mutable real data.
- Avoid exact content assertions; validate structural UI and contract success.

### How to run (Option B)

- `npm run test:all:qa` (baseline)
- Add-on deterministic full suite:
  - `playwright test e2e/marketplace-full-flow.spec.ts e2e/resume-builder-flow.spec.ts e2e/ui-stability.spec.ts`

---

## Selector strategy (both options)

Priority order:

1. `data-testid` on critical actions and page headers (best)
2. `getByRole` with stable accessible names (good)
3. `getByLabel` for form fields (good)
4. `getByText` only when non-ambiguous (avoid “strict mode violation”)

Minimum recommended `data-testid` targets:

- Recruiter:
  - create job CTA, publish CTA, applications pipeline stage control, note input/save
- Jobseeker:
  - job apply CTA, application status badge, resume analyze CTA, improve CTA

---

## UI stability checks (both options)

On key routes, assert:

- **No console errors** (collect + fail)
- **No failed requests** (collect + report; fail on 4xx/5xx unless allowlisted)
- **No horizontal overflow on mobile**
  - `document.documentElement.scrollWidth <= document.documentElement.clientWidth`

Artifacts:

- Screenshot + trace on failure (Playwright config already supports html report; traces can be set to on-first-retry).

---

## See also (inventory + upkeep)

- **`docs/QA_FULL_SITE_COVERAGE.md`** — Definition of Layer A (inventory-complete automation) vs B/C.
- **`docs/QA_COVERAGE_STATUS.md`** — Current coverage snapshot.
- **`docs/QA_CHANGE_CHECKLIST.md`** — What to edit when routes or Playwright specs change.
- **`docs/QA_ROUTE_INVENTORY.md`** — Canonical page + API list.

