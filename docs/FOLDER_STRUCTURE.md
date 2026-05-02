# AI Job Assistant – Folder Structure (current)

**Last updated:** 2026-05-02  
This project uses **Next.js App Router** with route groups for job seeker vs recruiter surfaces.

```
ai-job-assistant/
├── app/
│   ├── (dashboard)/                     # Job seeker route group
│   │   ├── dashboard/page.tsx
│   │   ├── resume-analyzer/page.tsx
│   │   ├── cover-letter/page.tsx
│   │   ├── interview-prep/page.tsx
│   │   ├── auto-apply/page.tsx
│   │   ├── smart-apply/page.tsx
│   │   ├── applications/page.tsx
│   │   ├── messages/page.tsx
│   │   ├── usage/page.tsx
│   │   └── ... (other job seeker pages)
│   ├── (recruiter)/                      # Recruiter route group
│   │   ├── recruiter/page.tsx
│   │   ├── recruiter/onboarding/page.tsx
│   │   ├── recruiter/company/page.tsx
│   │   ├── recruiter/jobs/page.tsx
│   │   ├── recruiter/applications/page.tsx
│   │   ├── recruiter/messages/page.tsx
│   │   ├── recruiter/usage/page.tsx
│   │   └── ... (other recruiter pages)
│   ├── api/                               # Route Handlers (REST-ish)
│   │   ├── usage/*                         # summary/history/feature-breakdown
│   │   ├── recruiter/*                      # recruiter APIs (company, jobs, applications, etc.)
│   │   ├── jobs/*                           # job seeker apply + job data
│   │   ├── messages/*                       # messaging APIs
│   │   ├── internal/email-retry/route.ts     # retry job endpoint (cron/manual)
│   │   └── webhooks/resend/route.ts          # Resend webhook receiver
│   ├── auth/callback/route.ts               # OAuth callback handler
│   ├── layout.tsx                           # Root layout
│   ├── middleware.ts                        # Request/session guards (repo root)
│   └── page.tsx                             # Marketing landing
├── components/
│   ├── layout/                              # Sidebars, topbars, shells
│   ├── ui/                                  # Shared UI primitives + feedback components
│   ├── messages/                            # Inbox UI, realtime badges, send state
│   ├── usage/                               # AI usage dashboard UI
│   ├── auto-apply/                          # Auto-apply feature components
│   ├── applications/                        # Application tracker + recruiter panels
│   ├── recruiter/                           # Recruiter feature-specific components
│   └── pwa/                                 # Install CTA, offline banner, dev SW reset
├── hooks/
│   ├── queries/                             # TanStack Query hooks for API routes
│   └── mutations/                           # Mutation hooks wrapping API routes
├── lib/
│   ├── ai.ts                                # Provider chain + caching wrappers
│   ├── gemini.ts                            # Gemini provider
│   ├── groq.ts                              # Groq OpenAI-compatible provider
│   ├── openai.ts                            # OpenAI provider
│   ├── email.ts                             # Resend send + logging/idempotency/retry metadata
│   ├── notifications.ts                     # In-app notifications helpers
│   ├── supabase/                            # server/admin/middleware clients
│   └── ... (validation, UX error helpers, storage helpers)
├── supabase/
│   ├── migrations/                          # SQL migrations (RLS, tables, grants, indexes)
│   └── schema.sql
├── e2e/                                     # Playwright E2E (mock auth + deterministic flows)
│   ├── real/                                # Real-user regression (*.real.spec.ts); storageState from setup
│   ├── auth/real-login.setup.ts             # Writes playwright/.auth/*.json
│   ├── site-wide-sweep.spec.ts              # Curated route stability
│   ├── full-site-page-inventory-mock.spec.ts # All pages from QA_ROUTE_INVENTORY (mock auth)
│   └── helpers/                             # network-mocks, ai-deterministic-mocks, fixtures
├── api-tests/                               # Playwright API-only (see playwright.api.config.ts)
│   ├── inventory-get-smoke.api.spec.ts
│   ├── inventory-mutations-smoke.api.spec.ts
│   ├── contracts.api.spec.ts
│   └── data-integrity.api.spec.ts
├── public/                                  # PWA assets: manifest, icons, offline.html
├── types/                                   # Shared TS types for UI/API
├── docs/                                    # Implementation + strategy docs
└── vercel.json                               # Cron config (if enabled on plan)
```

Notes:

- The precise route inventory is **`docs/QA_ROUTE_INVENTORY.md`**; architecture detail stays in **`docs/KNOWLEDGE_TRANSFER.md`**. This file describes the **shape and intent** of the main directories.
- If you add a new cross-cutting subsystem (email, caching, credits, etc.), update this file and KT together.
