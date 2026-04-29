# AI Job Assistant – Architecture (current)

**Last updated:** 2026-04-30  
**Source of truth for behavior:** `docs/KNOWLEDGE_TRANSFER.md`

## 1. System overview

AI Job Assistant is a multi-surface Next.js app for **job seekers** and **recruiters**:

- Job seeker tools: resume analysis + improvement, job match/tailor, auto-apply/smart auto-apply, interview prep, messaging, application tracking.
- Recruiter tools: company onboarding + multi-user teams, job posting CRUD, application pipeline + events, candidate screening/shortlisting, messaging, templates/alerts, entitlements/pricing simulation.

## 2. High-level architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                               Vercel                                  │
│  Next.js 15 App Router                                                 │
│  - UI routes: app/(dashboard)/* and app/(recruiter)/*                  │
│  - API routes: app/api/* (Route Handlers)                              │
│  - Middleware: middleware.ts (session bootstrap + protected routes)    │
│  - PWA: next-pwa (manifest + SW in production)                         │
└───────────────────────────────────────────────────────────────────────┘
                 │                                │
                 │                                │
                 ▼                                ▼
┌─────────────────────────────────────────┐  ┌──────────────────────────┐
│                Supabase                 │  │        External APIs      │
│ - Auth (OAuth/email)                    │  │ - AI providers (server)   │
│ - Postgres + RLS policies               │  │   Gemini → Groq → OpenAI   │
│ - Storage (resumes, attachments, logos) │  │ - Resend (email delivery) │
│ - Realtime (messages/notifications)     │  │ - Job sources (e.g. Adzuna)│
└─────────────────────────────────────────┘  └──────────────────────────┘
```

## 3. Key subsystems

### 3.1 Auth + session

- `middleware.ts` calls `updateSession()` (`lib/supabase/middleware.ts`) to refresh Supabase SSR cookies.
- Protected-route behavior (page vs API) is enforced in middleware and reinforced in layouts.
- Some endpoints are intentionally public (e.g. `api/public/*`, share endpoints, platform stats). Webhooks must also be public and verify via provider signatures.

### 3.2 Database + RLS (multi-tenant recruiter model)

- Supabase Postgres is the source of truth.
- **Job seeker isolation**: resume rows + analyses are owner-scoped.
- **Recruiter multi-tenant**:
  - `companies`, `company_memberships`, `company_invites`
  - `job_postings` are company-scoped (`company_id`)
  - `job_applications` are visible to company members for that job’s company
  - `application_events` provides the application timeline
- RLS is used as the primary access boundary, with **service-role** used only for cross-user notifications/emails and internal ops.

### 3.3 AI layer (providers + caching + credits)

**Provider chain (default):**

- Gemini (primary) → Groq (fallback) → OpenAI (fallback)

Core infrastructure:

- `lib/ai.ts`: provider selection + caching wrappers
- `lib/aiCache.ts`: DB-backed caching
- `lib/aiUsage.ts` + `lib/aiUsageQueries.ts`: token/credit/cost logging + credit enforcement controls

Key goals:

- Strict/guarded JSON outputs for critical flows
- Token reduction via caching + multi-step generation for heavy flows
- Credit enforcement with graceful `CREDITS_EXHAUSTED` handling

### 3.4 Email delivery (Resend) + lifecycle tracking

- `lib/email.ts`: best-effort send, idempotency guard, structured results
- `public.email_logs`: audit trail + retry metadata
- `POST /api/webhooks/resend`: verifies Svix signature (`RESEND_WEBHOOK_SECRET`) and updates delivery lifecycle fields on `email_logs`
- Retry endpoint: `GET|POST /api/internal/email-retry` protected by `CRON_SECRET` (Vercel Cron) or `INTERNAL_CRON_SECRET` (manual/internal)

### 3.5 PWA

- `next-pwa` enabled in production builds
- `public/manifest.json` + icons
- Offline UX: offline fallback page + banner patterns

## 4. Operational/rollout considerations

- **Environment variables** are required for each subsystem (Supabase, AI providers, Resend, cron secrets).
- **Migrations must be applied** before production features relying on new tables/columns are turned on.
- For platform limits (e.g., Vercel Cron frequency), prefer a scheduler compatible with the deployment tier.

