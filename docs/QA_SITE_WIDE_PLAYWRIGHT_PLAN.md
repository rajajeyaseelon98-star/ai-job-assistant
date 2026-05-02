# Site-wide QA Plan (Playwright) — Jobseeker + Recruiter

**Purpose:** Catch UI regressions and functional issues across the entire app with high signal, without modifying backend logic or breaking existing flows.

**Stack:** Next.js App Router (SSR + client interactions), Tailwind UI, Supabase-backed auth  
**Existing QA:** Playwright suite `npm run test:all:qa` (critical E2E + API contract tests)

---

## Principles

- **No backend changes:** do not change API contracts, DB queries, RLS, or server logic.
- **No credential exposure:** never print credentials to console/output; do not commit secrets.
- **Two modes of testing:**
  - **Deterministic CI mode (mock auth):** fast, stable, runs in PRs.
  - **Real-user regression mode (real login):** higher confidence, runs locally or on a schedule.

---

## Current repo reality (baseline)

- E2E specs live in `e2e/**`
- API specs live in `api-tests/**`
- Scripts:
  - `npm run test:e2e:critical` → critical E2E flows
  - `npm run test:api` → API contract/data-integrity tests
  - `npm run test:all:qa` → critical E2E + API
- Playwright config uses a dedicated dev port and blocks service workers:
  - avoids “wrong server on 3000” issues
  - prevents PWA SW from intercepting requests during tests

---

## Mode A — Deterministic CI mode (keep as-is)

### Goal

Catch regressions quickly and reliably without relying on real accounts, real data, or external providers.

### What it covers

- Jobseeker critical flows (resume, job match, auto apply, messages)
- Recruiter critical flows (jobs, candidates, shortlist run, messaging)
- API contract + data-integrity checks

### How to run

- `npm run test:all:qa`

---

## Mode B — Real-user regression mode (add, do not replace)

### Goal

Simulate real login behavior for both roles on both desktop and mobile viewports to catch:

- real auth/session issues
- routing/nav regressions
- role-gated UI issues
- mobile layout overflow / tap-target problems

### Credential handling

- Store creds in a local-only env file (gitignored), e.g. `.env.e2e.local`
- Tests read from environment variables (never hardcode)

Suggested env keys:

- `E2E_JOBSEEKER_EMAIL`
- `E2E_JOBSEEKER_PASSWORD`
- `E2E_RECRUITER_EMAIL`
- `E2E_RECRUITER_PASSWORD`
- `PLAYWRIGHT_BASE_URL` (optional)

An example template lives at `.env.e2e.example` (copy to `.env.e2e.local` locally).

### Session reuse (storageState)

Create one-time “setup” tests that log in and save storage state files:

- `playwright/.auth/jobseeker.json`
- `playwright/.auth/recruiter.json`

Then role projects reuse these states so tests do not re-login every run.

### Proposed test layout (aligned to repo)

- `e2e/auth/real-login.setup.ts`
- `e2e/real/jobseeker.real.spec.ts`
- `e2e/real/recruiter.real.spec.ts`

### Viewports

- **Desktop:** 1280×800
- **Mobile:** 375×812

### Core real-user smoke flows

#### Jobseeker (real login)

- Login
- Resume analyzer page loads
- Paste resume text and analyze (happy path)
- Improved resume view renders
- Job match page loads and runs once
- Application tracker loads
- Messages inbox loads (if available)

#### Recruiter (real login)

- Login
- Recruiter dashboard loads
- Jobs list loads
- Create job page loads (and basic publish flow if stable in env)
- Applications page loads
- Messages page loads (if available)

---

## Site-wide UI/UX validation (cheap high-signal checks)

### Mobile overflow check (critical)

On key pages, assert:

- `document.documentElement.scrollWidth <= document.documentElement.clientWidth`

Fail with screenshot on violation.

### Console + network health

- Fail tests on `console.error` on app pages (exclude known benign noise if needed).
- Track failed network requests (`requestfailed`) and surface in report.

### Loading/disabled states

- For primary CTAs that trigger async actions, confirm:
  - disabled while pending
  - visible loading indicator or text change

---

## Regression reporting format

For each issue:

- **Classification:** UI / Functional / Performance / Flaky
- **Role:** jobseeker or recruiter
- **Viewport:** desktop or mobile
- **Route/page:** exact path
- **Steps to reproduce**
- **Expected vs actual**
- **Artifacts:** screenshot/trace (on retry)

---

## Recommended runbook

### Daily / PR checks (fast)

- `npm run test:all:qa`

### Pre-release confidence (real-user)

- Run setup once (refresh session state)
- Run mobile + desktop real smoke flows for both roles
- Re-run `npm run test:all:qa` if any UI fixes were applied

Convenience scripts:

- `npm run test:e2e:real:setup`
- `npm run test:e2e:real:smoke`

---

## Optional improvements (only if needed)

- Add `data-testid` only where role/label selectors are unstable.
- Add a small “top routes load” smoke suite per role (mobile) for navigation regressions.

