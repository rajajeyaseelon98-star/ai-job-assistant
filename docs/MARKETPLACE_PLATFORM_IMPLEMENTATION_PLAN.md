# Marketplace Platform Implementation Plan (Phases 0–6)

**Project:** AI Job Assistant  
**Goal:** Extend the existing AI-heavy app into a trustworthy, end-to-end job marketplace platform (job seeker + recruiter/company workflows) **without rewriting** the current system and **without breaking existing AI features**.

This plan is intentionally **phase-gated**: each phase has explicit deliverables, DB/RLS requirements, API/UI scope, and verification steps. Execution should proceed **in order**.

---

## Guiding Principles (Non‑Negotiables)

- **Security first (multi-tenant):** Company data must be strictly isolated. RLS must be correct **before** UI features ship.
- **Entitlements before billing:** Implement plan/limits/feature gates (data model + enforcement) first; payments come later.
- **No breaking changes:** Keep existing routes and AI flows working; introduce new flows behind additive schemas and safe defaults.
- **Consistency:** Reuse existing patterns for:
  - Next.js App Router route structure (`app/(...)/...`, `app/api/.../route.ts`)
  - Supabase server/client helpers
  - Structured API errors (`ok`, `message`, `meta.requestId`, `retryable`, `nextAction` where applicable)
  - UI reliability components (Inline retry/receipts, banners)
- **Observability:** No silent failures. Add request IDs and log warnings for partial failures where relevant.

---

## Data Model Overview (Target End State)

### Core entities
- **Company**: `companies`
- **Recruiter membership**: `company_memberships` (user ↔ company + role)
- **Invite mechanism**: `company_invites` (optional but recommended)
- **Jobs**: `job_postings` linked to `company_id`
- **Applications**: `job_applications` with status + timeline/events
- **Notifications**: in-app `notifications` (already exists), extended for marketplace events
- **Entitlements**: `company_entitlements` (plan/limits/status)
- **Email delivery (foundation)**: provider integration + optional delivery log table

---

## Phase 0 — Inventory + Decisions (Foundation)

### Objective
Confirm how the current codebase represents recruiters/jobs/applications/messages/notifications, and lock down the minimal decisions needed to implement multi-tenant marketplace flows safely.

### Deliverables
- **Current state mapping** (documented):
  - Where recruiter identity/role is stored
  - How jobs are stored and owned today
  - How applications are stored today (and what’s missing)
  - Current notifications + messaging triggers
  - Existing pricing/credits mechanisms (AI credits vs recruiter plans)
- **Decisions locked** (written into this doc):
  - **Tenancy:** Users can belong to **one or more companies** via membership; UI uses **active company** determined by `users.last_active_role` + membership existence.
  - **Roles:** `owner | admin | recruiter` (kept simple)
  - **Job ownership:** Every job must belong to exactly one company via `company_id`.
  - **Application visibility:** Recruiters can only see applications to jobs in their company.

### Verification
- Identify all routes/pages that will be impacted by the new ownership + status lifecycle.

---

## Phase 1 — Database Schema + RLS (Must be First)

### Objective
Create the multi-tenant company/recruiter foundation, link jobs to companies, and extend applications with lifecycle fields **with correct RLS**.

### DB Deliverables (Supabase migrations)
Create migrations under `supabase/migrations/`:

1) **`companies`**
- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `website text null`
- `industry text null`
- `size text null`
- `location text null`
- `created_by uuid not null references auth.users(id)`
- `created_at timestamptz not null default now()`

2) **`company_memberships`**
- `id uuid primary key default gen_random_uuid()`
- `company_id uuid not null references public.companies(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `role text not null check (role in ('owner','admin','recruiter'))`
- `status text not null default 'active' check (status in ('invited','active'))`
- `invited_by uuid null references auth.users(id)`
- `created_at timestamptz not null default now()`
- Unique constraint: `(company_id, user_id)`

3) **`company_invites`** (recommended)
- `id uuid primary key default gen_random_uuid()`
- `company_id uuid not null references public.companies(id) on delete cascade`
- `email text not null`
- `role text not null check (role in ('admin','recruiter'))`
- `token text not null unique`
- `expires_at timestamptz not null`
- `accepted_at timestamptz null`
- `invited_by uuid not null references auth.users(id)`
- `created_at timestamptz not null default now()`

4) **`job_postings` update**
- Add `company_id uuid null references public.companies(id)`
- Backfill strategy:
  - For existing recruiter-created jobs: set company based on creator membership if possible.
  - Otherwise keep `company_id` nullable initially + enforce non-null for new jobs.

5) **`job_applications` update**
- Add:
  - `status text not null default 'applied' check (status in ('applied','viewed','shortlisted','rejected','interview','offer','hired'))`
  - `status_updated_at timestamptz not null default now()`
  - `recruiter_notes text null`
  - `updated_at timestamptz not null default now()`

6) **Optional: `application_events`** (timeline)
- `id uuid pk`
- `application_id uuid fk`
- `actor_user_id uuid fk auth.users`
- `event_type text` (e.g. `status_change`, `note_added`)
- `from_status text null`
- `to_status text null`
- `meta jsonb null`
- `created_at timestamptz default now()`

### RLS Deliverables
Implement RLS policies:
- `companies`: readable by members; writable by owner/admin
- `company_memberships`: readable by members; manage by owner/admin
- `job_postings`: recruiter members can CRUD only within their company
- `job_applications`: 
  - candidate can read/write their own application
  - recruiter members can read/update applications for jobs in their company
- `application_events`: readable by candidate + recruiters (scoped), insertable by recruiters

### Verification
- SQL checks for cross-company leakage (attempt reads with non-member users must return 0 rows)
- Basic insert/update flows pass with RLS enabled

---

## Phase 2 — Company Onboarding + Recruiter Entry Flow

### Objective
Provide a clear recruiter entry path (like “Hire Talent”) and ensure recruiter accounts can create/attach to a company.

### UI Deliverables
- Landing CTA: “Hire Talent” → `/recruiter/signup` (or `/recruiter/onboarding` depending on current routes)
- Page: `app/(recruiter)/recruiter/onboarding/page.tsx`
  - Create company form
  - Create membership for current user as `owner`
  - Success: redirect to `/recruiter`

### API Deliverables
- `POST /api/recruiter/company` (create company + membership)
- `GET /api/recruiter/company` (fetch current user’s company + role)

### Middleware/Layout Guarding
- If user is recruiter and has no active membership → redirect to onboarding
- Ensure job seeker flows remain unaffected

### Verification
- New recruiter can sign up, create company, and access recruiter dashboard
- Existing recruiter users without company are routed cleanly

---

## Phase 3 — Job → Apply → Recruiter Visibility + Application Lifecycle

### Objective
Make the platform feel “alive”: applications must be visible to recruiters, and status changes must reflect back to candidates.

### Candidate Flow Deliverables
- Apply action inserts into `job_applications` with status `applied`
- Candidate applications list shows:
  - job info
  - current status
  - last updated
  - timeline (if `application_events` exists)

### Recruiter Flow Deliverables
- Recruiter Applications page:
  - list applications for company jobs
  - view candidate resume/profile snapshot
  - change status + add notes
  - ability to message candidate (reuse messaging)

### API Deliverables
- `GET /api/recruiter/applications` (company-scoped)
- `PATCH /api/recruiter/applications/[id]` (status + notes + event insert)
- `GET /api/applications` (candidate-scoped)

### Verification
- Applying to a company job makes the candidate appear in recruiter applications list
- Recruiter status update appears for candidate
- No cross-company visibility

---

## Phase 4 — Notification System (In‑App First, Email‑Ready)

### Objective
Add trust: users must get clear confirmations and updates.

### In-app Notifications
Triggers:
- Candidate applied → notify recruiters in company
- Recruiter changed status → notify candidate
- Message sent → (already exists; ensure reliability)

### API Deliverables
- `GET /api/notifications` (already exists; ensure it supports new types)
- `POST /api/notifications/mark-read` (if not already)

### Verification
- Bell badge increments for new events
- Notifications entries created with correct `user_id`

---

## Phase 5 — Subscription / Plan System (Entitlements + Limits)

### Objective
Create a “billing foundation” without payments yet: plan selection, entitlements, and server-side enforcement.

### DB Deliverables
Create `company_entitlements` (or `subscriptions`) with:
- `company_id`
- `plan` (`free|pro|enterprise`)
- `status` (`active|inactive`)
- `job_post_limit`
- `candidate_unlock_limit`
- `messaging_limit`
- `created_at`, `updated_at`

### UI Deliverables
- Recruiter pricing page (existing `/recruiter/pricing`):
  - select plan
  - simulate activation (writes entitlements row)

### Enforcement (Server-side)
Before actions:
- posting new job
- unlocking candidate details (if applicable)
- bulk shortlist runs (optional)

### Verification
- Limits block actions with friendly error + upgrade CTA

---

## Phase 6 — Email Notifications (Resend/SendGrid) for Critical Events

### Objective
Add optional email delivery for critical trust moments while keeping in-app notifications canonical.

### Provider Recommendation
- Prefer **Resend** for simplicity (HTTP API + templates).

### Env / Secrets (server only)
- `RESEND_API_KEY` (or `SENDGRID_API_KEY`)
- Never expose via `NEXT_PUBLIC_*`.

### Delivery Events
- Recruiter invite email
- New application received (recruiter)
- Status updated (candidate)
- Message notification (optional; throttle)

### Implementation Notes
- Avoid sending emails directly in hot-path DB updates if possible:
  - If no background worker exists yet, send asynchronously and never fail the primary action.
  - Optionally log delivery attempts in `notification_deliveries`.

---

## Implementation notes (current codebase reality)

These notes clarify where the current implementation intentionally diverges from the original “target end state” wording while preserving the plan’s intent.

### Entitlements model (implemented)

The plan described a standalone `company_entitlements` table. Current implementation stores plan/limits on `public.companies`:

- `companies.plan_tier` (`starter|pro|enterprise`)
- `companies.max_active_jobs`
- `companies.max_team_members`

And exposes it via:

- `GET/PATCH /api/recruiter/entitlements`

This still delivers “entitlements before billing” and supports enforcement at job creation/activation and invite flows.

### Email delivery reliability (implemented + hardened)

Email delivery is implemented with Resend plus operational safety:

- `public.email_logs` audit table + idempotency + retry metadata
- `GET|POST /api/internal/email-retry` replay endpoint (cron/manual)
- `POST /api/webhooks/resend` lifecycle updates (`delivered|bounced|complaint`)

### RLS recursion pitfall (company_memberships)

Avoid policies on `company_memberships` that query `company_memberships` inside the policy condition; Postgres can raise:

- `42P17 infinite recursion detected in policy for relation "company_memberships"`

Mitigation pattern:

- `SECURITY DEFINER` helper functions with `row_security = off` for membership checks.

### Verification
- Email sends in production environment
- Rate limiting / spam controls

---

## Rollout Controls (Recommended)

Add feature flags (env) to safely deploy:
- `MARKETPLACE_COMPANIES_ENABLED`
- `MARKETPLACE_APPLICATION_LIFECYCLE_ENABLED`
- `MARKETPLACE_EMAIL_NOTIFICATIONS_ENABLED`

Start with enabled in staging/dev, then production.

---

## QA / Test Plan (Minimum)

### Security & RLS
- Recruiter A cannot see recruiter B’s company data.
- Candidate cannot see other candidates’ applications.

### Core flows
- Recruiter onboarding → create company → create job → candidate applies → recruiter updates status → candidate sees update.

### Notifications
- In-app notifications created for apply + status change.
- Email sends only when enabled.

### Regression
- Existing AI tools (resume analyze, cover letter, auto-apply, messaging) remain functional.

---

## Documentation Updates (During Execution)

Whenever a phase changes app behavior or schemas:
- Update `docs/KNOWLEDGE_TRANSFER.md`
- Add/extend doc sections for:
  - recruiter onboarding
  - company membership model
  - application status lifecycle
  - notification triggers

---

## Execution Start Condition

Proceed to Phase 0 → Phase 1 only after:
- Current repo compiles (`npm run build`)
- Supabase migration workflow confirmed
- Vercel env vars configured for production

