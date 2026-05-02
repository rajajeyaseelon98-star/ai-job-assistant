# Full-site QA coverage (“100%” definition)

This document defines what **full-site coverage** means for this repo and how automation maps to it.

**Sources of truth**

- **Pages + APIs:** `docs/QA_ROUTE_INVENTORY.md` (66 pages, 104 API routes as listed).
- **Critical prod stories:** `docs/QA_PROD_CRITICAL_USER_STORIES.md`.

---

## Layer A — Inventory completeness (route smoke)

Goal: **every inventory route is exercised at least once** in CI-friendly deterministic runs.

| Surface | Mechanism | Scope |
|--------|-----------|--------|
| **API GET + dynamic GET** | `api-tests/inventory-get-smoke.api.spec.ts` | Cookie mock auth (`api-tests/helpers/auth-context.ts`) |
| **API POST/PATCH/DELETE** | `api-tests/inventory-mutations-smoke.api.spec.ts` | Minimal/invalid payloads — asserts bounded HTTP codes, not business outcomes |
| **API contracts (focused)** | `api-tests/contracts.api.spec.ts`, `api-tests/data-integrity.api.spec.ts` | Validation envelopes, idempotency hints |
| **Pages (all 66)** | `e2e/full-site-page-inventory-mock.spec.ts` | Mock auth + placeholder IDs for dynamic segments; **no error-boundary UI** |
| **Broad stability** | `e2e/site-wide-sweep.spec.ts` | Curated high-traffic routes + console checks |

**Passing Layer A** means: inventory lists match automation lists when `QA_ROUTE_INVENTORY.md` changes — update the specs in the same PR.

---

## Layer B — Behavioral correctness (not automatic “100%”)

Goal: **correct outcomes** per feature (RLS, credits, multi-step flows).

- Real sessions: `e2e/real/*.real.spec.ts` + Playwright projects in `playwright.config.ts`.
- Requires `.env.e2e.local`, seeded data, and time — tracked separately from Layer A.

---

## Layer C — Deterministic AI outputs

LLM-backed endpoints are **non-deterministic** unless controlled.

**Approaches:**

1. **Playwright `page.route` mocks** — see `e2e/helpers/network-mocks.ts` and `e2e/helpers/ai-deterministic-mocks.ts` (fixture-shaped JSON for ATS / improve / job-match style routes).
2. **Dedicated integration tests** against stubbed `lib/ai` (future / optional).
3. **Real-user tests** — assert structure, loading states, or “best-effort” success (see real specs).

**Passing “deterministic AI”** for CI means either mocks are active or assertions avoid brittle exact strings.

---

## Maintenance checklist

See **`docs/QA_CHANGE_CHECKLIST.md`** for the full matrix (routes, Playwright, KT).

When adding or removing **`app/**/page.tsx`** or **`app/api/**/route.ts`**:

1. Update `docs/QA_ROUTE_INVENTORY.md` (or regenerate if you add a script later).
2. Extend **`inventory-get-smoke`** / **`inventory-mutations-smoke`** if new HTTP methods appear.
3. Extend **`full-site-page-inventory-mock`** `expandInventoryRoute` if new `:param` patterns appear.
4. Update **`docs/KNOWLEDGE_TRANSFER.md`** if behavior or auth changes.

---

## Commands

```bash
# API inventory + contracts (starts dev server unless PLAYWRIGHT_SKIP_WEBSERVER=1)
npm run test:api

# Full page inventory (mock auth; long-running ~10 min)
npx playwright test e2e/full-site-page-inventory-mock.spec.ts --project=chromium

# Combined CI gate (critical browser + API)
npm run test:all:qa
```

---

**Last updated:** 2026-05-02
