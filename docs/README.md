# Documentation index (`docs/`)

Not every file here is updated on the same schedule: **QA / testing docs** track automation and should change when routes or Playwright specs change. **Strategy / gap / investor** docs are snapshots and only need edits when the underlying product facts change.

## QA, testing, and inventory (keep in sync with code)

| Document | Purpose |
|----------|---------|
| **[QA_ROUTE_INVENTORY.md](./QA_ROUTE_INVENTORY.md)** | Canonical list of pages + API routes — update when `app/**` routes change |
| **[QA_FULL_SITE_COVERAGE.md](./QA_FULL_SITE_COVERAGE.md)** | What “100%” means (Layer A/B/C) |
| **[QA_COVERAGE_STATUS.md](./QA_COVERAGE_STATUS.md)** | Current automation snapshot |
| **[QA_CHANGE_CHECKLIST.md](./QA_CHANGE_CHECKLIST.md)** | Checklist: inventory → Playwright → `KNOWLEDGE_TRANSFER` |
| **[QA_PROD_CRITICAL_USER_STORIES.md](./QA_PROD_CRITICAL_USER_STORIES.md)** | Production-critical stories ↔ tests |
| **[QA_SITE_WIDE_PLAYWRIGHT_PLAN.md](./QA_SITE_WIDE_PLAYWRIGHT_PLAN.md)** | Two-mode QA (deterministic vs real-user) |
| **[QA_FULL_E2E_OPTION_A_B_PLAN.md](./QA_FULL_E2E_OPTION_A_B_PLAN.md)** | Option A vs B rollout |
| **[AUTOMATED_TESTING_STRATEGY.md](./AUTOMATED_TESTING_STRATEGY.md)** | Strategy and npm scripts |
| **[TEST_PLAN_E2E.md](./TEST_PLAN_E2E.md)** | Middleware matrix, env vars, Playwright notes |

## Single source of truth for implementation

| Document | Purpose |
|----------|---------|
| **[KNOWLEDGE_TRANSFER.md](./KNOWLEDGE_TRANSFER.md)** | Routes, APIs, auth, middleware, lib — **update when behavior changes** |

## Other references (update only when relevant)

Architecture (`ARCHITECTURE.md`), features (`FEATURES_FLOW.md`), gaps (`GAP_ANALYSIS.md`, `LAUNCH_READINESS_GAP_REPORT.md`), design (`DESIGN_SYSTEM.md`), PWA (`PWA_IMPLEMENTATION_GUIDE.md`), email (`EMAIL_DELIVERY_RUNBOOK.md`), marketplace plans, investor/cost reports — refresh when those areas change.

**Last updated:** 2026-05-02
