# QA coverage status (site-wide)

This doc answers: **“Have we tested the entire site without missing anything?”**

**Short answer:** For **inventory completeness** (every listed page + API route exercised once in deterministic automation), **yes** — see **`docs/QA_FULL_SITE_COVERAGE.md`** Layer A.

For **behavioral correctness on real data** (RLS, credits, realistic IDs, multi-step flows), coverage is **mixed**: real-user specs (`e2e/real/*.real.spec.ts`) and manual QA still matter.

---

## Inventory sources

- **Route inventory:** `docs/QA_ROUTE_INVENTORY.md` (**66 pages**, **104 API routes**)
- **What “100%” means here:** `docs/QA_FULL_SITE_COVERAGE.md`
- **Historical planning:** `docs/QA_FULL_E2E_OPTION_A_B_PLAN.md`

---

## Layer A — Deterministic inventory coverage (CI-safe)

| Artifact | What it proves |
|----------|----------------|
| `api-tests/inventory-get-smoke.api.spec.ts` | GET handlers (+ dynamic GET paths) respond within bounded HTTP codes; JSON parses when applicable |
| `api-tests/inventory-mutations-smoke.api.spec.ts` | Every POST/PATCH/DELETE inventory endpoint receives at least one request |
| `api-tests/contracts.api.spec.ts` + `data-integrity.api.spec.ts` | Focused validation / idempotency contracts |
| `e2e/full-site-page-inventory-mock.spec.ts` | All **66** pages render without React error-boundary UI (mock auth; placeholders for `:slug` / `:id` / tokens) |
| `e2e/site-wide-sweep.spec.ts` | Curated route stability + console hygiene |
| `e2e/pricing-branches.spec.ts` | Upgrade / plan-selection UI branches |

**npm:** `npm run test:api`, `npm run test:e2e:full-inventory-pages`

---

## Layer B — Real-user / seeded regression

Playwright projects (`real-*` in `playwright.config.ts`) use `playwright/.auth/*.json` and `.env.e2e.local`. These validate **real** sessions and data — not every inventory path on every run; see **`docs/QA_PROD_CRITICAL_USER_STORIES.md`**.

---

## Layer C — Deterministic AI

LLM routes are wrapped or mocked for stable CI where needed: **`e2e/helpers/ai-deterministic-mocks.ts`** + **`e2e/helpers/network-mocks.ts`**. Full textual parity with production AI output is explicitly **out of scope** for Layer A.

---

## When the inventory changes

1. Update **`docs/QA_ROUTE_INVENTORY.md`**.
2. Extend **`inventory-*-smoke`** specs and **`expandInventoryRoute`** in **`e2e/full-site-page-inventory-mock.spec.ts`** if new patterns appear.
3. Refresh **`docs/KNOWLEDGE_TRANSFER.md`** if auth or routes behave differently.

**Last updated:** 2026-05-02
