# QA / docs change checklist

Use this when you **add or change routes, APIs, auth, or user-visible flows** so automation and docs stay aligned.

## 1. Inventory (single source for “what exists”)

| Change | Update |
|--------|--------|
| New/removed **page** or **API** | `docs/QA_ROUTE_INVENTORY.md` |
| New **production-critical** journey | `docs/QA_PROD_CRITICAL_USER_STORIES.md` (optional but recommended) |

## 2. Playwright / API tests

| Change | Update |
|--------|--------|
| New **`GET /api/...`** (inventory) | `api-tests/inventory-get-smoke.api.spec.ts` (correct role: job seeker / recruiter / public) |
| New **`POST` / `PATCH` / `DELETE`** | `api-tests/inventory-mutations-smoke.api.spec.ts` |
| Stricter **validation contract** | `api-tests/contracts.api.spec.ts` |
| New **dynamic page pattern** (`:slug`, `:id`, …) | `e2e/full-site-page-inventory-mock.spec.ts` → `expandInventoryRoute()` |
| New **pricing / upgrade** UI branch | `e2e/pricing-branches.spec.ts` or dedicated spec |
| AI endpoint needs **stable CI** assertions | `e2e/helpers/ai-deterministic-mocks.ts` + route mocks in the spec |
| Real-user regression | `e2e/real/*.real.spec.ts` + `playwright.config.ts` project if needed |

Run locally:

- `npm run test:api`
- `npm run test:e2e:full-inventory-pages` (long)
- `npm run test:all:qa` (critical browser + API)

## 3. Auth / middleware / Supabase

| Change | Update |
|--------|--------|
| **Middleware** protection or API allowlist | `docs/KNOWLEDGE_TRANSFER.md` §2.1 + this file if new exception pattern |
| **`getUser()` vs raw `supabase.auth.getUser()`** | Prefer `lib/auth.ts` `getUser()` so **cookie mock auth** works in dev/E2E |
| Browser **session/cookies** on localhost | `lib/supabase/client.ts` — note cookie options for dev vs prod |
| Dev-only **E2E login** API | `docs/TEST_PLAN_E2E.md` (env: `E2E_INTERNAL_AUTH_SECRET`), `.env.e2e.example` |

## 4. Documentation cross-links

| Artifact | Purpose |
|----------|---------|
| `docs/QA_FULL_SITE_COVERAGE.md` | Defines Layer A/B/C (inventory vs behavioral vs deterministic AI) |
| `docs/QA_COVERAGE_STATUS.md` | Current automation snapshot |
| `docs/AUTOMATED_TESTING_STRATEGY.md` | Strategy + folder layout |
| `docs/TEST_PLAN_E2E.md` | Env vars, ports, middleware vs routes |
| `docs/KNOWLEDGE_TRANSFER.md` | **Required** for routes, APIs, auth, lib behavior (workspace rule) |

## 5. Quick “did we miss anything?” for API edits

- [ ] Consumers still match response shape (`hooks/queries`, panels).
- [ ] RLS / `getUser()` behavior unchanged for real users (mock auth is additive via `getUser()`).
- [ ] Inventory specs still green: `npm run test:api`.

**Last updated:** 2026-05-02
