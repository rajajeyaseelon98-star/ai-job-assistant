# Project Analysis Report

## 0. Post-Implementation Update (2026-04-23)

- **AI usage and credit system added end-to-end**:
  - DB: `public.ai_usage` table + `users.total_credits` / `users.used_credits`
  - API: `/api/usage/summary`, `/api/usage/history`, `/api/usage/feature-breakdown`
  - UI: `/(dashboard)/usage` page + sidebar navigation entry `AI Usage` -> `/usage`
  - Server tracking: `lib/ai.ts` now logs tokens/credits/cost per AI call through `lib/aiUsage.ts`
- **Credit enforcement behavior**:
  - Pre-call guard in AI layer checks remaining credits when `AI_CREDITS_ENFORCEMENT_ENABLED=true`
  - Standardized API responses for exhaustion: HTTP `402`, `error: "CREDITS_EXHAUSTED"`, upgrade message
  - Structured client handling via `lib/client-ai-error.ts` (`toAiUiError`) and CTA UI `components/ui/AICreditExhaustedAlert.tsx`
- **Operational hardening completed**:
  - Added migration `20260423183000_ai_usage_grants.sql` to fix `permission denied for table ai_usage` by granting `SELECT, INSERT` to `authenticated`
  - Usage query APIs now fail-loud with `detail` on underlying DB/query errors
  - AI usage tracking now emits warning logs on failures for observability
- **Affected implementation areas**:
  - Core AI: `lib/ai.ts`, `lib/aiRollout.ts`, `lib/aiUsage.ts`, `lib/aiUsageQueries.ts`, `lib/aiCreditError.ts`
  - Job seeker pages: resume analyzer, interview prep, smart apply, salary insights, usage dashboard
  - Recruiter pages: job generate/optimize/auto-shortlist, salary estimator, skill-gap, candidate ATS analyze

## 1. Project Overview

- **What this application does:** AI-powered job platform with two product surfaces:
  - **Job seeker:** resume upload/analysis/improvement, job matching, cover letter generation, interview prep, auto-apply, smart auto-apply, analytics, streak/reward loops, messaging.
  - **Recruiter:** company profile, job posting lifecycle, candidate search, AI screening/shortlisting, interview pipeline, recruiter messaging/templates/alerts, intelligence dashboards.
- **Core purpose:** increase interview outcomes and hiring efficiency through workflow automation + AI assistance + data feedback loops.
- **Target users:**
  - Individual candidates (primarily tech but prompts support broad roles).
  - Recruiters and hiring teams managing pipelines.
- **Key capabilities:**
  - End-to-end job-seeker workflow from resume ingestion to tracked applications.
  - End-to-end recruiter workflow from job publishing to candidate outreach.
  - Shared messaging + notification system.
  - AI orchestration layer with provider fallback and DB cache.
  - Strong Supabase-centered auth, RLS, storage, realtime model.

---

## 2. Tech Stack (Detected Automatically)

### Frontend

- **Framework:** Next.js 15 App Router + React 18 + TypeScript (`package.json`, `app/**`).
- **State management:**
  - Server-state: TanStack React Query (`lib/query-provider.tsx`, `hooks/queries/**`).
  - Local/component state: React hooks in `app/**` pages/layouts + `components/**`.
  - Browser persistence: targeted `localStorage/sessionStorage` usage in certain onboarding/form flows.
- **UI libraries:** Tailwind CSS, Framer Motion, Lucide React, React Markdown.
- **Routing system:** Next.js App Router with role-separated route groups:
  - `app/(dashboard)` for job seeker.
  - `app/(recruiter)` for recruiter.
- **Data fetching strategy:**
  - Client hooks wrap REST APIs via `lib/api-fetcher.ts`.
  - Query keys centralized in hook modules (`hooks/queries/*-keys`).
  - Mutations in `hooks/mutations/**`.

### Backend

- **Framework/API structure:** Next.js Route Handlers (`app/api/**/route.ts`).
- **Architecture style:** modular monolith / BFF style:
  - UI + API + domain services in one repo.
  - Business logic in `lib/**`, route handlers as controllers.
- **Middleware usage:** `middleware.ts` enforces auth/session refresh, protected paths, recruiter route gating, redirect behavior.

### Database

- **Type:** Supabase PostgreSQL.
- **ORM:** no ORM; direct Supabase client queries.
- **Schema overview:** `supabase/schema.sql` + many migrations:
  - Core entities: `users`, `resumes`, `resume_analysis`, `improved_resumes`, `applications`.
  - Recruiter entities: `companies`, `job_postings`, `job_applications`, `message_templates`, `saved_searches`.
  - Shared systems: `messages`, `notifications`, `usage_logs`, `ai_cache`, `auto_apply_runs`, `smart_apply_rules`, `candidate_skills`, `skill_badges`, `platform_stats`, `daily_actions`, `opportunity_alerts`, `user_streaks`.
- **Security model:** heavy RLS usage + security-definer RPCs for cross-role safe operations.

### AI / External Services

- **LLM providers:**
  - Gemini (`lib/gemini.ts`, model `gemini-2.5-flash`).
  - Groq (`lib/groq.ts`, model `llama-3.3-70b-versatile` by default).
  - OpenAI (`lib/openai.ts`, model `gpt-4o-mini`).
- **AI routing:** `lib/ai.ts` prefers Gemini and falls back to **Groq**, then **OpenAI** on quota/rate-limit/temporary-provider errors.
- **AI caching:** `lib/aiCache.ts` stores hashed prompt responses in `ai_cache` with feature TTLs.
- **External APIs:** Adzuna jobs integration in auto-jobs / auto-apply flows.
- **File services:** Supabase Storage buckets for resumes, avatars, company logos, message attachments.

---

## 3. Folder Structure Breakdown

- **`/app`** -> All route-level code (public/auth pages, job seeker pages, recruiter pages, API routes).
- **`/app/api`** -> Backend HTTP controllers (93 implemented route handlers in this snapshot).
- **`/components`** -> Reusable UI + domain components (resume, recruiter, messages, dashboard, landing, shared UI).
- **`/hooks`** -> React Query query/mutation adapters and realtime UI hooks.
- **`/lib`** -> Core business services (auth, AI, usage/rate limiting, engines, analytics, storage helpers).
- **`/types`** -> Domain contracts for API payloads and feature objects.
- **`/utils`** -> File parsing helpers (`pdfParser`, `docxParser`).
- **`/supabase`** -> DB schema, grants, migrations (including RLS and buckets).
- **`/docs`** -> Product/architecture/flow/KT documentation.
- **`/e2e`** -> Playwright end-to-end tests.

---

## 4. File-by-File Analysis (IMPORTANT)

Below is a deep inventory of important files (architecture-critical and feature-critical).  
For very large route sets, files are grouped by domain while still naming exact files.

### File: `middleware.ts`

- **What it does:** central access control and redirect orchestration.
- **Key logic blocks:**
  1. Refreshes Supabase session via middleware client.
  2. Identifies protected paths and protected APIs.
  3. Returns API `401` for unauthenticated protected API requests.
  4. Redirects unauthenticated users to `/login?next=...` for protected pages.
  5. Enforces recruiter-only guard on `/recruiter/**`.
  6. Redirects authenticated users away from `/`, `/login`, `/signup` to role-specific home.
- **Dependencies:** `lib/supabase/middleware.ts`, `lib/auth-landing-path.ts`.

### File: `lib/auth.ts`

- **What it does:** canonical user/profile retrieval for APIs and server logic.
- **Key functions:**
  - `getUser()` obtains authenticated user + enriched profile row.
  - `ensureUserRow()` backfills `users` row if missing.
- **Important logic:** links auth identity to app profile, ensures role/plan fields exist.

### File: `lib/ai.ts`

- **What it does:** provider abstraction + fallback + cache wrappers.
- **Key functions:**
  - `aiGenerate`, `aiGenerateContent`.
  - `cachedAiGenerate`, `cachedAiGenerateContent`.
- **Step-by-step core block:**
  1. Attempt Gemini call if key exists.
  2. On quota/429-like errors, fallback to OpenAI.
  3. For cached calls, hash normalized prompt content and read `ai_cache`.
  4. On cache miss, call provider and persist result.

### File: `lib/aiCache.ts`

- **What it does:** deterministic caching layer in DB.
- **Important logic blocks:**
  - TTL map by feature (e.g., `resume_analysis`, `resume_improve`, `job_match`).
  - hash generation (`sha256(feature + normalized content)`).
  - tolerant read/write (cache failures do not fail user request).

### File: `lib/usage.ts` and `lib/rateLimit.ts`

- **What they do:**
  - `usage.ts` handles monthly feature quotas by plan.
  - `rateLimit.ts` handles burst protection using `usage_logs`.
- **Important internals:**
  - Most expensive feature endpoints call usage check before model invocation.
  - Rate limiting is DB-backed and currently fail-open on DB query failure.

### File: `app/api/upload-resume/route.ts`

- **What it does:** GET resume list + POST upload and parse.
- **Step-by-step POST flow:**
  1. Auth check.
  2. Parse multipart payload.
  3. Validate extension/MIME and magic bytes.
  4. Upload binary to Supabase Storage.
  5. Parse text via `pdfParser` / `docxParser`.
  6. Insert `resumes` row with `parsed_text`.
  7. Return stored resume metadata.

### File: `app/api/analyze-resume/route.ts` + `lib/ats-resume-analysis.ts`

- **What they do:** ATS score + actionable feedback generation.
- **Key flow internals:**
  1. Auth + rate + usage checks.
  2. Build base or recheck prompt.
  3. Call `cachedAiGenerateContent`.
  4. Parse strict JSON output and normalize arrays.
  5. Optionally persist to `resume_analysis` for `resumeId`.

### File: `app/api/improve-resume/route.ts`

- **What it does:** transforms resume into normalized improved JSON schema.
- **Important blocks:**
  - Supports three contexts: base rewrite, target-job tailoring, optimize-current.
  - Can inject previous ATS feedback into prompt.
  - Uses `normalizeImprovedResumeContent` for output shape stability.
  - Persists to `improved_resumes`.

### File: `app/api/job-match/route.ts`

- **What it does:** resume-vs-JD matching with persisted result.
- **Internal sequence:**
  1. Validate text size.
  2. Plan/rate gating.
  3. Generate structured match JSON.
  4. Persist to `job_matches`.

### File: `app/api/generate-cover-letter/route.ts`

- **What it does:** cover letter generation from one of three resume sources.
- **Important internal branching:**
  - Source priority: `improvedResumeId` > `resumeId` > inline `resumeText`.
  - Uses Gemini directly if key exists, otherwise OpenAI helper.
  - Saves result in `cover_letters`.

### File: `app/api/auto-jobs/route.ts`

- **What it does:** job finder orchestration.
- **Internal pipeline:**
  1. Extract skills from resume text via AI.
  2. Search Adzuna jobs.
  3. Generate AI-suggested jobs.
  4. If Adzuna jobs exist, call AI again to generate match reasons.
  5. Persist full snapshot to `job_searches`.

### File: `app/api/auto-apply/route.ts` + `lib/autoApplyEngine.ts`

- **What they do:** assisted auto-apply run lifecycle.
- **Engine sequence:**
  1. Create `auto_apply_runs` row.
  2. `getOrCreateStructuredResume` (AI call if `structured_json` missing).
  3. Fetch internal + Adzuna jobs.
  4. Pre-rank with non-AI scorer.
  5. Deep AI matching per selected job (loop).
  6. Save results and status `ready_for_review`.
  7. User confirms selections via `/api/auto-apply/[id]/confirm` -> inserts `applications`.

### File: `lib/smartApplyEngine.ts` + `app/api/smart-apply/trigger/route.ts`

- **What they do:** scheduled automation.
- **Trigger internals:**
  - Runs smart rules.
  - Sends daily reports and refreshes platform snapshots.
  - Runs recruiter auto-push.
  - Scans opportunity alerts.
  - Cleans stale rate-limit and expired cache rows.

### File: Messaging routes (`app/api/messages/**`)

- **What they do:** inbox, threads, unread summaries, read receipts, attachment upload/search.
- **Important internals:**
  - Uses RPCs for role-safe recipient search/profile retrieval.
  - Signs attachment URLs before returning messages.
  - Supports thread cursor pagination and mark-read sync.

### File: Recruiter job routes (`app/api/recruiter/jobs/**`)

- **What they do:** CRUD postings + AI generation/optimization + auto-shortlisting.
- **Critical paths:**
  - `generate-description`: structured job draft from minimal recruiter input.
  - `optimize`: improves existing posting and returns suggestions.
  - `auto-shortlist`: batches applicants (10 at a time), AI scores each batch, updates stage/summary.

### File: Recruiter candidate routes (`app/api/recruiter/candidates/**`)

- **What they do:** list/search candidate pool, candidate detail, similar candidates.
- **Important logic:** current search strategy loads a bounded candidate set and applies in-memory filters; this is a key scaling hotspot.

### File: `supabase/schema.sql` and major migrations

- **What they do:** define all table contracts, indexes, RLS, and bucket policies.
- **Important blocks:**
  - RLS ownership policies across candidate/recruiter data.
  - Messaging policies + supporting RPCs.
  - Storage bucket policies (`avatars`, `company-logos`, `message-attachments`).
  - Realtime publication and replica identity adjustments for `messages`.

---

## 5. Feature Breakdown (CRITICAL)

### Feature: Resume Upload + ATS Analysis

#### What it does:
Allows candidates to upload resumes, extract text, and get AI ATS scoring and recommendations.

#### How it works (STEP-BY-STEP FLOW):

1. User uploads file in `resume-analyzer` UI.
2. Hook calls `POST /api/upload-resume`.
3. API validates file type/magic bytes, uploads to storage, parses text, inserts `resumes`.
4. UI triggers `POST /api/analyze-resume`.
5. API performs auth/rate/usage checks.
6. ATS prompt is built (`lib/ats-resume-analysis.ts`), AI called via cache wrapper.
7. Parsed JSON result persisted to `resume_analysis` (when linked to `resumeId`).
8. Response returns ATS score + gaps + improvements for UI rendering.

### Feature: Resume Improve / Tailor

1. User submits resume (+ optional JD or previous ATS feedback).
2. `POST /api/improve-resume` receives request.
3. Route builds prompt variant (base, target job, optimize current).
4. AI returns structured JSON.
5. Result normalized and stored in `improved_resumes`.
6. UI renders improved sections and optional export/download.

### Feature: Job Match

1. User submits resume and job description in `job-match` page.
2. API validates payload and plan/rate limits.
3. AI generates match score + skill gap analysis.
4. Result stored in `job_matches`.
5. UI displays match and improvement recommendations.

### Feature: Cover Letter Generator

1. User selects improved resume or uploaded resume or enters raw text.
2. `POST /api/generate-cover-letter` resolves resume source text.
3. API builds prompt with company/role/JD context.
4. Model generates letter.
5. Persisted in `cover_letters`; UI shows editable content and history.

### Feature: Interview Prep

1. User enters role and experience.
2. `POST /api/interview-prep` called.
3. AI returns technical + behavioral + practical question sets.
4. Session saved in `interview_sessions`.
5. UI renders grouped preparation sets.

### Feature: Auto Job Finder

1. User provides resume text + optional location.
2. Route extracts skills via AI.
3. Route queries Adzuna.
4. Route generates AI-suggested jobs.
5. Route optionally generates AI match reasons for Adzuna jobs.
6. Combined results saved in `job_searches` and returned to UI.

### Feature: Auto Apply (Assisted)

1. User starts run from auto-apply page.
2. `POST /api/auto-apply` creates run record.
3. Engine structures resume if needed.
4. Engine fetches jobs and pre-ranks with deterministic scorer.
5. Engine deep-matches jobs via AI loop and computes interview probability.
6. Run status becomes `ready_for_review`.
7. User confirms selected jobs.
8. Confirm endpoint inserts tracker `applications` and closes run.

### Feature: Smart Auto Apply (Background)

1. User creates rule via `POST /api/smart-apply`.
2. Cron/trigger endpoint executes active rules.
3. Each rule invokes auto-apply engine with rule constraints.
4. Matching jobs auto-confirmed up to daily/weekly limits.
5. Notifications and counters updated.

### Feature: Recruiter Job Lifecycle + AI Assist

1. Recruiter creates/edits job post.
2. Optional AI generation/optimization routes improve copy.
3. Job persists in `job_postings`.
4. Candidate applications collected in `job_applications`.
5. Recruiter can run AI auto-shortlist to rank batches and progress candidates.

### Feature: Messaging (Shared)

1. Sender opens thread and composes message.
2. Optional attachment uploaded first (`/api/messages/attachment`).
3. Message stored in `messages`.
4. Receiver gets notification + realtime inbox update.
5. Read actions call `/api/messages/mark-read` and sync badges/thread state.

---

## 6. API Analysis

### Coverage

- **Total route files:** 94
- **Implemented endpoints (exported methods):** 93
- **Stub/no method export:** `app/api/recruiter/messages/route.ts`

### Endpoint families (all APIs by domain)

- **Core user/profile:**  
  `/api/user`, `/api/user/role`, `/api/user/avatar`, `/api/user/delete-account`, `/api/profile`, `/api/usage`, `/api/dev/plan`
- **Resume/documents:**  
  `/api/upload-resume`, `/api/resume-file/[id]`, `/api/analyze-resume`, `/api/resume-analysis/[id]`, `/api/improve-resume`, `/api/improved-resumes*`
- **Job-seeker AI tools:**  
  `/api/job-match`, `/api/job-matches/[id]`, `/api/generate-cover-letter`, `/api/cover-letters*`, `/api/interview-prep`, `/api/import-linkedin`
- **Jobs and applications:**  
  `/api/jobs`, `/api/jobs/[id]`, `/api/jobs/[id]/apply`, `/api/jobs/applied`, `/api/applications*`, `/api/auto-jobs*`
- **Automation:**  
  `/api/auto-apply*`, `/api/smart-apply*`, `/api/daily-report`
- **Messaging/notifications:**  
  `/api/messages*`, `/api/notifications`
- **Recruiter domain:**  
  `/api/recruiter/jobs*`, `/api/recruiter/applications*`, `/api/recruiter/candidates*`, `/api/recruiter/company*`, `/api/recruiter/templates*`, `/api/recruiter/alerts*`, `/api/recruiter/push`, `/api/recruiter/intelligence`, `/api/recruiter/top-candidates`, `/api/recruiter/instant-shortlist`, `/api/recruiter/skill-gap`, `/api/recruiter/salary-estimate`, `/api/recruiter/resumes/*`
- **Analytics/growth/public:**  
  `/api/dashboard`, `/api/history`, `/api/activity-feed`, `/api/insights`, `/api/career-coach`, `/api/competition`, `/api/resume-performance`, `/api/skill-demand`, `/api/salary-intelligence`, `/api/hiring-prediction`, `/api/streak*`, `/api/daily-actions`, `/api/opportunity-alerts*`, `/api/share`, `/api/share-result`, `/api/platform-stats`, `/api/public/extract-resume`, `/api/public/fresher-resume`

### Internal logic pattern (common across endpoints)

1. Authenticate (`getUser` or Supabase auth user).
2. Role-check for recruiter-only endpoints.
3. Validate body/query/UUID and text length.
4. Apply burst throttling (`checkRateLimit`) and/or plan quota checks (`checkAndLogUsage`) for AI-heavy routes.
5. Execute domain logic in route and/or `lib/*`.
6. Persist to Supabase tables/storage.
7. Return JSON response with safe error handling.

---

## 7. Data Flow Architecture

### Core request/response path

`User UI -> Hook (React Query) -> /api route -> lib service -> Supabase DB/Storage/Realtime -> /api response -> Hook cache -> UI render`

### Example text diagram

`ResumeAnalyzer page -> useAnalyzeResume mutation -> POST /api/analyze-resume -> runAtsAnalysisFromText -> cachedAiGenerateContent -> (Gemini/OpenAI) -> resume_analysis insert -> JSON response -> ATS result component`

### Realtime messaging path

`Sender POST /api/messages -> messages row insert + notification -> Supabase Realtime event -> recipient thread/unread hooks invalidate -> UI badge/thread update`

---

## 8. AI/Automation Flow (VERY IMPORTANT)

### AI provider/routing flow

1. Route calls `cachedAiGenerate` or `cachedAiGenerateContent`.
2. Cache lookup by deterministic hash in `ai_cache`.
3. Cache miss -> Gemini call attempted.
4. Quota/rate-limit error -> OpenAI fallback.
5. Response persisted in cache with feature TTL.
6. Route parses/normalizes JSON and persists domain result.

### AI features and prompt/input/output structures

- **ATS analysis:** resume text in, JSON `{atsScore, missingSkills, resumeImprovements, recommendedRoles}` out.
- **Resume improve:** resume/JD/feedback in, normalized 5-section resume JSON out.
- **Job match:** resume + JD in, score + skill deltas JSON out.
- **Cover letter:** resume + job context in, plain text letter out.
- **Interview prep:** role+level in, grouped Q&A arrays JSON out.
- **Auto jobs:** skills extraction + listing generation + reasoning; multiple prompts per request.
- **Auto apply deep match:** structured resume + job context in, `{match_score, match_reason, cover_letter_body, tailored_summary}` out per job.
- **Recruiter AI tools:** JD generation, optimization, screening, salary estimation, skill gap, auto-shortlist batch scoring.

### Automation flows

- `POST /api/smart-apply/trigger` runs:
  - smart apply execution
  - daily report notifications
  - platform stats refresh
  - skill demand refresh
  - recruiter auto-push
  - opportunity scans
  - stale usage/cache cleanup

---

## 9. State Management Flow

- **Global server state:** React Query cache via `QueryClientProvider`.
- **Domain query hooks:** encapsulate API contracts and invalidation behavior.
- **Mutation hooks:** centralize optimistic updates/error handling for writes.
- **Local state:** forms, modal state, tab/selection state in page components.
- **Synchronization:**
  - Query invalidations after successful mutations.
  - Realtime hooks for messaging/notifications.
  - Dedicated unread summary hooks for topbar/badges.

---

## 10. Performance & Scalability Observations

- **Hotspot:** recruiter candidate search uses bounded large fetch + in-memory filter strategy.
- **Hotspot:** AI loops in auto-apply and auto-shortlist can accumulate latency and token cost.
- **Hotspot:** heavy exact counts across analytics/usage can become expensive at scale.
- **Positive:** AI cache and pre-filter scoring reduce model usage in repeated flows.
- **Positive:** role route separation and hook-based fetch abstractions simplify targeted optimization.

---

## 11. Security Observations

- **Strong areas:**
  - Middleware + per-route auth checks (defense in depth).
  - Recruiter role gates on sensitive endpoints.
  - RLS across core tables + security-definer RPCs for controlled cross-role operations.
  - Input validation for text length, UUIDs, file MIME/signatures.
- **Risks/improvements:**
  - Public AI/parse endpoints should have stronger anti-abuse throttles.
  - Rate limiter currently fail-open if DB query fails.
  - Sensitive mutating endpoints should explicitly enforce CSRF-origin protections.
  - Broad grants posture should remain tightly audited against RLS assumptions.

---

## 12. Missing Features / Improvements

- Add robust abuse controls (IP-based + CAPTCHA) on public AI and file parsing routes.
- Improve candidate search to DB-native ranking/filtering at scale.
- Add transaction or compensation logic for account deletion to avoid partial cleanup.
- Expand observability:
  - Cache hit/miss by feature.
  - AI latency by endpoint.
  - Prompt/response token telemetry.
- Formalize queue/background workers for long AI loops to reduce request-time pressure.

---

## 13. Final Architecture Summary

- **System design overview:** full-stack Next.js modular monolith with Supabase as identity/data/storage backbone and integrated AI service layer.
- **Strengths:**
  - Broad feature completeness for both sides of marketplace.
  - Good layering (`app/api` controllers + `lib` services + hook adapters).
  - Strong RLS-centric security model and robust validations.
  - Practical AI fallback + cache strategy.
- **Weaknesses:**
  - Some expensive loops remain synchronous/request-bound.
  - Public endpoint abuse controls can be tighter.
  - Search/analytics workloads need scaling patterns as data volume grows.

---

## 14. Execution Flow Examples (VERY IMPORTANT)

### Example: Resume Upload Flow

1. User selects file in `ResumeUpload` component.
2. `useUploadResume` mutation sends multipart to `POST /api/upload-resume`.
3. API validates file signature/type and size.
4. File uploaded to Supabase Storage.
5. Parser extracts text (`pdfParser`/`docxParser`).
6. `resumes` row inserted with path + parsed text.
7. API returns resume metadata.
8. UI updates resume list and state.

### Example: ATS Analysis Flow

1. User clicks analyze in resume analyzer page.
2. `useAnalyzeResume` calls `POST /api/analyze-resume`.
3. Route runs auth + rate + usage checks.
4. `runAtsAnalysisFromText` builds ATS prompt.
5. `cachedAiGenerateContent` checks `ai_cache`; on miss calls model.
6. JSON parsed and normalized.
7. Optional `resume_analysis` insert occurs.
8. Response updates ATS result card.

### Example: Auto-Apply Flow

1. User starts auto-apply from `/auto-apply`.
2. `POST /api/auto-apply` creates `auto_apply_runs` row.
3. Background engine sets run `processing`.
4. Engine structures resume if `structured_json` missing (`getOrCreateStructuredResume`).
5. Engine fetches jobs (internal + Adzuna).
6. Engine pre-ranks with deterministic scorer.
7. Engine loops deep AI matching for candidate jobs.
8. Engine saves sorted results and sets `ready_for_review`.
9. User reviews selections in UI.
10. User confirms -> `POST /api/auto-apply/[id]/confirm` inserts final `applications`.
11. Notifications/activity are updated.

### Example: Recruiter Auto-Shortlist Flow

1. Recruiter opens job detail and triggers auto-shortlist.
2. UI calls `POST /api/recruiter/jobs/[id]/auto-shortlist`.
3. API verifies recruiter role and job ownership.
4. Fetches `applied` candidates with resume text.
5. Creates batched candidate prompt payloads (10 per batch).
6. Calls AI, parses per-candidate score + shortlist flag.
7. Updates `job_applications` with match score and summaries.
8. Moves qualified candidates to `shortlisted`.
9. Returns total screened/shortlisted for UI.

### Example: Messaging + Read Sync Flow

1. Sender composes message (optionally uploads attachment first).
2. `POST /api/messages` inserts message row.
3. Notification sent to receiver.
4. Receiver sees realtime unread update in bell/inbox.
5. Receiver opens thread (`GET /api/messages/thread`).
6. Receiver reads messages and marks read (`POST /api/messages/mark-read`).
7. Realtime + hook invalidation updates read state and unread badges on both ends.

---

## 15. In-Depth Line-by-Line Code Walkthroughs (As Requested)

This section uses the exact style you requested: **line-range -> functionality**.

### File: `middleware.ts`

- **Line 6-8:** Enters middleware and refreshes auth session using `updateSession`; extracts current pathname.
- **Line 10-31:** Handles authenticated-user redirect policy for landing/auth pages:
  - If user is logged in and visits `/`, `/login*`, or `/signup*`, route away.
  - If email not confirmed, force `/login?error=verify` (except already on login).
  - Otherwise compute default destination (`/dashboard` or `/recruiter`) and redirect.
- **Line 34-67:** Builds `isProtected` boolean:
  - Includes all candidate tools, recruiter routes, settings/history/pricing, and most `/api/*`.
  - Excludes public APIs (`/api/public/*`, `/api/platform-stats`, `/api/share-result`, `/api/share/`).
- **Line 69-77:** Unauthenticated access handling:
  - API calls return JSON `401`.
  - Page routes redirect to `/login` with `next` param.
- **Line 79-83:** Email verification enforcement for protected non-API pages.
- **Line 85-106:** Recruiter defense-in-depth:
  - If path starts with `/recruiter`, verify role.
  - Uses E2E mock role when present.
  - Otherwise reads `users.role` from DB; non-recruiter redirected to `/select-role?next=...`.
- **Line 112-116:** Matcher excludes static assets and image/file extensions from middleware overhead.

### File: `app/api/analyze-resume/route.ts`

- **Line 10-14:** POST entry + auth guard.
- **Line 16-17:** Burst throttling via `checkRateLimit`.
- **Line 19-35:** JSON body parse and typed extraction:
  - `resumeText`, optional `resumeId`,
  - optional `recheckAfterImprovement` and `previousAnalysis`.
- **Line 37-40:** Input length validation (`resumeText` max 50,000 chars).
- **Line 42-49:** Plan-based quota gate (`checkAndLogUsage` for `resume_analysis`).
- **Line 51-57:** Calls ATS service `runAtsAnalysisFromText`, including recheck context when provided.
- **Line 58-68:** AI/runtime error handling with dev-only detail output.
- **Line 70:** Non-blocking streak activity recording.
- **Line 72-87:** Optional persistence:
  - If `resumeId` provided, verify ownership (`resumes` lookup by `id + user_id`).
  - Insert ATS output into `resume_analysis`.
- **Line 89:** Response payload includes analysis plus `_usage` counters (`used`, `limit`).

### File: `app/api/improve-resume/route.ts`

- **Line 13-67:** Prompt architecture:
  - Base ATS rewrite objective.
  - Tailor modes (`target_job`, `optimize_current`).
  - Optional ATS-feedback reinforcement template.
  - Strict JSON schema contract for model output.
- **Line 68-72:** Auth guard.
- **Line 74-76:** Rate limit check.
- **Line 77-93:** Parse request and derive intent:
  - Accepts `resumeText`/`resume_text`, optional `resumeId`.
  - Optional `jobTitle`, `jobDescription`.
  - `tailorIntent` mode.
  - Optional `previousAnalysis`.
- **Line 94-98:** Resume length validation.
- **Line 100-108:** Plan/quota gate (`resume_improve` is Pro-gated by usage config).
- **Line 110-114:** Initialize default prompt and user content (resume slice to 12k).
- **Line 115-127:** If prior ATS feedback exists:
  - Hydrates placeholders (`ATS_SCORE`, missing skills, improvements).
  - Builds feedback-focused prompt and tighter resume slice (10k).
- **Line 128-135:** Else if job context exists:
  - Chooses tailor block by intent.
  - Adds target role + JD (JD sliced to 4k) + resume (10k).
- **Line 137-145:** AI execution and normalization:
  - Calls `cachedAiGenerate(..., jsonMode: true, cacheFeature: "resume_improve")`.
  - Handles markdown-fenced JSON.
  - Normalizes output via `normalizeImprovedResumeContent`.
- **Line 145-154:** Model/parse failure handling with user-friendly error.
- **Line 156-157:** Streak activity update (non-blocking).
- **Line 159-169:** Optional `resumeId` ownership verification before relational save.
- **Line 170-180:** Inserts improved output into `improved_resumes` with optional JD metadata.
- **Line 182-190:** Logs public activity feed event (non-blocking).
- **Line 192-195:** Returns normalized content + `improvedResumeId`.

### File: `lib/autoApplyEngine.ts`

- **Line 9-24:** Defines deep-match prompt and strict output schema (`match_score`, `match_reason`, `cover_letter_body`, `tailored_summary`).
- **Line 37-77:** `fetchAdzunaJobs`:
  - Reads Adzuna credentials from env.
  - Builds compact query from top roles/skills.
  - Calls external API with timeout.
  - Normalizes into internal job shape.
- **Line 79-113:** `fetchInternalJobs`:
  - Queries active `job_postings`, optional location filter.
  - Normalizes to same unified job shape.
- **Line 115-187:** `deepMatchJob`:
  - Builds prompt content from full structured resume + job.
  - Calls cached AI deep match (`cacheFeature: "job_match"`).
  - Parses AI JSON and clamps score.
  - Computes interview probability using deterministic helper.
  - Returns enriched job result object.
  - Fallback branch returns pre-filter score + safe defaults if AI fails.
- **Line 198-206:** `runAutoApply` entry + 2-minute hard timeout guard.
- **Line 210-216:** `updateRun` helper updates `auto_apply_runs` with timestamp.
- **Line 218-226:** Start run (`processing`), then load/derive structured resume; fail run if missing.
- **Line 228-247:** Fetch jobs from internal + Adzuna in parallel; if none found, finalize as empty `ready_for_review`.
- **Line 249-259:** Pre-rank jobs and pre-filter by salary before expensive AI calls.
- **Line 261:** Persist `jobs_found`.
- **Line 263-272:** Deep-match loop:
  - Iterates salary-filtered ranked jobs.
  - Calls AI per job.
  - Re-applies salary safety check post-match.
  - Accumulates results.
- **Line 274-282:** Sort by match score and finalize run state to `ready_for_review`.
- **Line 285-290:** Catch timeout/runtime failures and mark run `failed` with error message.

### File: `app/api/messages/route.ts`

- **Line 12-16:** `previewMessage` helper truncates notification preview to max length.
- **Line 18-19:** Defines inbox page-size defaults and hard caps.
- **Line 21-33:** GET setup:
  - Auth check.
  - Parses query params (`unread`, `before`, `limit`) with cap enforcement.
- **Line 35-52:** Base message query:
  - Reads messages where current user is sender or receiver.
  - Supports unread-only filter for receiver.
  - Supports cursor (`before`) pagination.
  - Returns 500 on DB query failure.
- **Line 54-58:** Enriches rows with signed attachment URLs and computes pagination metadata.
- **Line 59-78:** Builds `peer_profiles`:
  - Computes opposite-side peer IDs from returned messages.
  - Calls RPC `messaging_peer_profiles` to safely fetch name/avatar.
- **Line 80-87:** Returns paginated payload (`messages`, `peer_profiles`, `has_more`, `next_before`, `partial`).
- **Line 90-95:** POST auth + rate gate.
- **Line 97-114:** Parse JSON body with optional attachment fields.
- **Line 116-122:** Validate `receiver_id` presence and UUID format.
- **Line 124-144:** Content/attachment validation:
  - If no attachment, message content required and max length enforced.
  - If attachment present, validates ownership of attachment path and trims optional text.
- **Line 148-164:** Recipient validation using security-definer RPC `user_role_for_id`; avoids direct `users` read RLS pitfalls.
- **Line 166-180:** Role compatibility rules:
  - Recruiter -> only job seeker.
  - Job seeker -> only recruiter.
- **Line 182-189:** Sanitizes attachment metadata fields.
- **Line 191-205:** Inserts message row with optional attachment fields.
- **Line 207-210:** DB insert error handling.
- **Line 212-230:** Notification fanout:
  - Builds sender label + title/preview.
  - Sends notification to receiver with message metadata.
- **Line 232-233:** Returns signed-URL-enriched created message with status `201`.

---

### Reusable Pattern for Any File (so you can ask this for line 10-100 of any file)

Use this structure:

1. **Line X-Y:** Entry/setup logic (imports, constants, function start).
2. **Line Y-Z:** Auth/validation/guard rails.
3. **Line Z-A:** Core business branch 1.
4. **Line A-B:** Core business branch 2 / fallbacks.
5. **Line B-C:** Persistence + side effects.
6. **Line C-D:** Response payload and error handling.

If you want, I can now generate **the same line-by-line breakdown for every file in `/app/api`** in a second report file (very long, endpoint-by-endpoint).

---

## 16. Full `/app/api` Endpoint Line-Range Catalog (Exhaustive)

This section is the complete API-level deep dive you requested.

Format:
- **Method(s)** implemented
- **Entry/Auth** line range
- **Validation** line range
- **DB reads/writes** line range
- **AI/external calls** line range
- **Response/errors** line range

### Candidate Core

#### File: `app/api/activity-feed/route.ts`
- Method(s): `GET` (`6-26`)
- Entry/Auth: `17-17`
- Validation: `7-21`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `12-24`

#### File: `app/api/analyze-resume/route.ts`
- Method(s): `POST` (`10-91`)
- Entry/Auth: `13-13`
- Validation: `12-44`
- DB reads/writes: `72-81`
- AI/external calls: none detected in route file
- Response/errors: `13-89`

#### File: `app/api/career-coach/route.ts`
- Method(s): `GET` (`8-16`)
- Entry/Auth: `11-11`
- Validation: `11-11`
- DB reads/writes: `9-10`
- AI/external calls: none detected
- Response/errors: `11-14`

#### File: `app/api/competition/route.ts`
- Method(s): `GET` (`6-20`)
- Entry/Auth: `9-9`
- Validation: `8-8`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `9-17`

#### File: `app/api/daily-actions/route.ts`
- Method(s): `GET` (`8-24`), `PATCH` (`25-38`)
- Entry/Auth: `11-11`, `28-28`
- Validation: `11-23`, `28-31`
- DB reads/writes: `9-10`, `26-27`
- AI/external calls: none detected
- Response/errors: `11-18`, `28-36`

#### File: `app/api/daily-report/route.ts`
- Method(s): `GET` (`6-20`)
- Entry/Auth: `9-9`
- Validation: `8-8`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `9-17`

#### File: `app/api/dashboard/route.ts`
- Method(s): `GET` (`6-66`)
- Entry/Auth: `8-8`
- Validation: `8-8`
- DB reads/writes: `11-43`
- AI/external calls: none detected
- Response/errors: `8-55`

#### File: `app/api/feedback/route.ts`
- Method(s): `POST` (`6-53`)
- Entry/Auth: `9-9`
- Validation: `8-30`
- DB reads/writes: `37-41`
- AI/external calls: none detected
- Response/errors: `9-51`

#### File: `app/api/history/route.ts`
- Method(s): `GET` (`5-49`)
- Entry/Auth: `7-7`
- Validation: `7-7`
- DB reads/writes: `9-34`
- AI/external calls: none detected
- Response/errors: `7-42`

#### File: `app/api/insights/route.ts`
- Method(s): `GET` (`9-27`)
- Entry/Auth: `12-12`
- Validation: `11-11`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `12-24`

#### File: `app/api/profile/route.ts`
- Method(s): `GET` (`8-53`), `PATCH` (`54-94`)
- Entry/Auth: `11-11`, `57-57`
- Validation: `10-21`, `56-76`
- DB reads/writes: `14-36`, `67-90`
- AI/external calls: none detected
- Response/errors: `11-45`, `57-92`

#### File: `app/api/platform-stats/route.ts`
- Method(s): `GET` (`5-14`)
- Entry/Auth: none detected
- Validation: none detected
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `8-11`

#### File: `app/api/usage/route.ts`
- Method(s): `GET` (`5-14`)
- Entry/Auth: `8-8`
- Validation: `7-7`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `8-12`

### Applications and Jobs

#### File: `app/api/applications/route.ts`
- Method(s): `GET` (`9-28`), `POST` (`29-106`)
- Entry/Auth: `12-12`, `32-98`
- Validation: `11-11`, `31-62`
- DB reads/writes: `15-16`, `70-71`
- AI/external calls: none detected
- Response/errors: `12-26`, `32-104`

#### File: `app/api/applications/[id]/route.ts`
- Method(s): `GET` (`6-34`), `PATCH` (`35-85`), `DELETE` (`86-113`)
- Entry/Auth: `12-12`, `41-60`, `92-92`
- Validation: `8-16`, `37-68`, `88-96`
- DB reads/writes: `20-21`, `70-73`, `86-103`
- AI/external calls: none detected
- Response/errors: `12-32`, `41-83`, `92-111`

#### File: `app/api/jobs/route.ts`
- Method(s): `GET` (`4-68`)
- Entry/Auth: none detected
- Validation: `5-53`
- DB reads/writes: `16-18`
- AI/external calls: none detected
- Response/errors: `57-60`

#### File: `app/api/jobs/[id]/route.ts`
- Method(s): `GET` (`5-32`)
- Entry/Auth: none detected
- Validation: `7-11`
- DB reads/writes: `15-17`
- AI/external calls: none detected
- Response/errors: `12-30`

#### File: `app/api/jobs/applied/route.ts`
- Method(s): `GET` (`9-28`)
- Entry/Auth: none detected
- Validation: `11-11`
- DB reads/writes: `15-16`
- AI/external calls: none detected
- Response/errors: `12-26`

#### File: `app/api/jobs/[id]/apply/route.ts`
- Method(s): `POST` (`8-150`)
- Entry/Auth: `20-23`
- Validation: `10-90`
- DB reads/writes: `60-144`
- AI/external calls: none detected
- Response/errors: `15-148`

### Messaging

#### File: `app/api/messages/route.ts`
- Method(s): `GET` (`21-89`), `POST` (`90-235`)
- Entry/Auth: `23-23`, `92-175`
- Validation: `23-51`, `92-224`
- DB reads/writes: `35-67`, `146-232`
- AI/external calls: none detected
- Response/errors: `23-80`, `92-233`

#### File: `app/api/messages/thread/route.ts`
- Method(s): `GET` (`14-83`)
- Entry/Auth: `16-16`
- Validation: `16-50`
- DB reads/writes: `35-63`
- AI/external calls: none detected
- Response/errors: `16-75`

#### File: `app/api/messages/attachment/route.ts`
- Method(s): `POST` (`14-62`)
- Entry/Auth: `16-35`
- Validation: `16-22`
- DB reads/writes: `45-47`
- AI/external calls: none detected
- Response/errors: `16-56`

#### File: `app/api/messages/mark-read/route.ts`
- Method(s): `POST` (`7-44`)
- Entry/Auth: `9-9`
- Validation: `9-19`
- DB reads/writes: `23-27`
- AI/external calls: none detected
- Response/errors: `9-38`

#### File: `app/api/messages/recipient-search/route.ts`
- Method(s): `GET` (`9-49`)
- Entry/Auth: `11-24`
- Validation: `11-37`
- DB reads/writes: `35-36`
- AI/external calls: none detected
- Response/errors: `11-47`

#### File: `app/api/messages/unread-summary/route.ts`
- Method(s): `GET` (`8-32`)
- Entry/Auth: `10-10`
- Validation: `10-10`
- DB reads/writes: `12-13`
- AI/external calls: none detected
- Response/errors: `10-30`

### Auto-Apply and Alerts

#### File: `app/api/auto-apply/route.ts`
- Method(s): `POST` (`11-106`), `GET` (`107-127`)
- Entry/Auth: `14-32`, `110-110`
- Validation: `13-60`, `109-109`
- DB reads/writes: `52-95`, `113-114`
- AI/external calls: none detected
- Response/errors: `14-104`, `110-125`

#### File: `app/api/auto-apply/[id]/route.ts`
- Method(s): `GET` (`5-29`), `PATCH` (`30-80`)
- Entry/Auth: `11-11`, `36-36`
- Validation: `7-14`, `32-61`
- DB reads/writes: `15-16`, `53-74`
- AI/external calls: none detected
- Response/errors: `11-27`, `36-78`

#### File: `app/api/auto-apply/[id]/confirm/route.ts`
- Method(s): `POST` (`7-81`)
- Entry/Auth: `13-43`
- Validation: `9-50`
- DB reads/writes: `17-57`
- AI/external calls: none detected
- Response/errors: `13-75`

#### File: `app/api/smart-apply/route.ts`
- Method(s): `GET` (`17-37`), `POST` (`38-125`), `PATCH` (`126-163`)
- Entry/Auth: `20-20`, `41-90`, `129-129`
- Validation: `19-19`, `40-99`, `128-142`
- DB reads/writes: `23-24`, `71-104`, `146-149`
- AI/external calls: none detected
- Response/errors: `20-34`, `41-122`, `129-161`

#### File: `app/api/smart-apply/trigger/route.ts`
- Method(s): `POST` (`21-163`)
- Entry/Auth: `28-48`
- Validation: `27-27`
- DB reads/writes: `39-119`
- AI/external calls: none detected
- Response/errors: `28-159`

#### File: `app/api/opportunity-alerts/route.ts`
- Method(s): `GET` (`9-21`), `PATCH` (`22-38`)
- Entry/Auth: `12-12`, `25-25`
- Validation: `12-20`, `25-28`
- DB reads/writes: `10-11`, `23-24`
- AI/external calls: none detected
- Response/errors: `12-15`, `25-36`

#### File: `app/api/opportunity-alerts/scan/route.ts`
- Method(s): `POST` (`10-18`)
- Entry/Auth: `13-13`
- Validation: `13-13`
- DB reads/writes: `11-12`
- AI/external calls: none detected
- Response/errors: `13-16`

#### File: `app/api/notifications/route.ts`
- Method(s): `GET` (`6-26`), `PATCH` (`27-66`)
- Entry/Auth: `9-9`, `30-30`
- Validation: `8-8`, `29-59`
- DB reads/writes: `12-13`, `40-58`
- AI/external calls: none detected
- Response/errors: `9-24`, `30-64`

### Resume, Cover Letter, AI Assist

#### File: `app/api/improve-resume/route.ts`
- Method(s): `POST` (`68-197`)
- Entry/Auth: `71-134`
- Validation: `70-143`
- DB reads/writes: `159-170`
- AI/external calls: none detected in route file
- Response/errors: `71-192`

#### File: `app/api/improved-resumes/route.ts`
- Method(s): `GET` (`6-32`)
- Entry/Auth: `9-9`
- Validation: `8-8`
- DB reads/writes: `12-13`
- AI/external calls: none detected
- Response/errors: `9-30`

#### File: `app/api/improved-resumes/[id]/route.ts`
- Method(s): `GET` (`6-24`)
- Entry/Auth: `11-11`
- Validation: `8-13`
- DB reads/writes: `14-15`
- AI/external calls: none detected
- Response/errors: `11-22`

#### File: `app/api/improved-resumes/[id]/download/route.ts`
- Method(s): `GET` (`8-39`)
- Entry/Auth: `13-13`
- Validation: `10-16`
- DB reads/writes: `17-18`
- AI/external calls: none detected
- Response/errors: `13-37`

#### File: `app/api/improved-resumes/export-docx/route.ts`
- Method(s): `POST` (`11-38`)
- Entry/Auth: `13-13`
- Validation: `13-25`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `13-31`

#### File: `app/api/upload-resume/route.ts`
- Method(s): `GET` (`8-54`), `POST` (`55-155`)
- Entry/Auth: `11-11`, `58-58`
- Validation: `10-45`, `57-84`
- DB reads/writes: `14-15`, `110-131`
- AI/external calls: none detected
- Response/errors: `11-32`, `58-148`

#### File: `app/api/resume-analysis/[id]/route.ts`
- Method(s): `GET` (`6-41`)
- Entry/Auth: `11-11`
- Validation: `8-13`
- DB reads/writes: `14-24`
- AI/external calls: none detected
- Response/errors: `11-32`

#### File: `app/api/resume-file/[id]/route.ts`
- Method(s): `GET` (`11-60`)
- Entry/Auth: `17-17`
- Validation: `13-35`
- DB reads/writes: `25-47`
- AI/external calls: none detected
- Response/errors: `17-58`

#### File: `app/api/resume-performance/route.ts`
- Method(s): `GET` (`6-24`)
- Entry/Auth: `9-9`
- Validation: `8-8`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `9-21`

#### File: `app/api/generate-cover-letter/route.ts`
- Method(s): `POST` (`18-157`)
- Entry/Auth: `21-137`
- Validation: `20-108`
- DB reads/writes: `50-132`
- AI/external calls: `120-122`
- Response/errors: `21-149`

#### File: `app/api/cover-letters/route.ts`
- Method(s): `GET` (`5-20`)
- Entry/Auth: `8-8`
- Validation: `7-7`
- DB reads/writes: `10-11`
- AI/external calls: none detected
- Response/errors: `8-18`

#### File: `app/api/cover-letters/[id]/route.ts`
- Method(s): `GET` (`5-22`), `PATCH` (`23-46`), `DELETE` (`47-63`)
- Entry/Auth: `10-10`, `28-28`, `52-52`
- Validation: `7-11`, `25-31`, `49-53`
- DB reads/writes: `12-13`, `35-38`, `47-57`
- AI/external calls: none detected
- Response/errors: `10-20`, `28-44`, `52-61`

#### File: `app/api/import-linkedin/route.ts`
- Method(s): `POST` (`43-98`)
- Entry/Auth: `46-46`
- Validation: `45-84`
- DB reads/writes: none detected
- AI/external calls: none detected in route file
- Response/errors: `46-96`

#### File: `app/api/public/extract-resume/route.ts`
- Method(s): `POST` (`13-61`)
- Entry/Auth: none detected
- Validation: `22-22`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `18-59`

#### File: `app/api/public/fresher-resume/route.ts`
- Method(s): `POST` (`22-93`)
- Entry/Auth: `35-57`
- Validation: `23-77`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `27-90`

### Matching, Prediction, Intelligence

#### File: `app/api/job-match/route.ts`
- Method(s): `POST` (`24-114`)
- Entry/Auth: `27-27`
- Validation: `26-79`
- DB reads/writes: `90-101`
- AI/external calls: none detected
- Response/errors: `27-112`

#### File: `app/api/job-matches/[id]/route.ts`
- Method(s): `GET` (`5-22`)
- Entry/Auth: `10-10`
- Validation: `7-11`
- DB reads/writes: `12-13`
- AI/external calls: none detected
- Response/errors: `10-20`

#### File: `app/api/hiring-prediction/route.ts`
- Method(s): `POST` (`7-61`)
- Entry/Auth: `10-10`
- Validation: `9-39`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `10-58`

#### File: `app/api/salary-intelligence/route.ts`
- Method(s): `GET` (`6-31`)
- Entry/Auth: `9-9`
- Validation: `8-19`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `9-28`

#### File: `app/api/skill-demand/route.ts`
- Method(s): `GET` (`7-29`)
- Entry/Auth: `10-10`
- Validation: `9-9`
- DB reads/writes: `15-16`
- AI/external calls: none detected
- Response/errors: `10-26`

#### File: `app/api/interview-prep/route.ts`
- Method(s): `POST` (`23-86`)
- Entry/Auth: `26-72`
- Validation: `25-66`
- DB reads/writes: `69-70`
- AI/external calls: none detected
- Response/errors: `26-82`

### Sharing, Social, Gamification

#### File: `app/api/share/route.ts`
- Method(s): `POST` (`6-55`)
- Entry/Auth: `9-9`
- Validation: `8-33`
- DB reads/writes: `24-50`
- AI/external calls: none detected
- Response/errors: `9-53`

#### File: `app/api/share-result/route.ts`
- Method(s): `POST` (`6-45`), `GET` (`46-65`)
- Entry/Auth: `9-9` (POST)
- Validation: `8-25`, `47-56`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `9-41`, `51-62`

#### File: `app/api/streak/route.ts`
- Method(s): `GET` (`9-21`), `POST` (`22-44`)
- Entry/Auth: `12-12`, `25-25`
- Validation: `12-20`, `25-33`
- DB reads/writes: `10-11`, `23-24`
- AI/external calls: none detected
- Response/errors: `12-15`, `25-42`

#### File: `app/api/streak-rewards/route.ts`
- Method(s): `GET` (`9-23`), `POST` (`24-42`)
- Entry/Auth: `12-12`, `27-27`
- Validation: `12-22`, `27-29`
- DB reads/writes: `10-11`, `25-26`
- AI/external calls: none detected
- Response/errors: `12-17`, `27-40`

#### File: `app/api/candidate-boost/route.ts`
- Method(s): `GET` (`6-21`), `POST` (`22-55`)
- Entry/Auth: `9-9`, `25-25`
- Validation: `8-8`, `24-44`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `9-17`, `25-52`

### User Account

#### File: `app/api/user/route.ts`
- Method(s): `GET` (`7-44`), `PATCH` (`45-127`)
- Entry/Auth: `9-38`, `47-77`
- Validation: `9-9`, `47-115`
- DB reads/writes: `13-27`, `59-123`
- AI/external calls: none detected
- Response/errors: `9-33`, `47-125`

#### File: `app/api/user/avatar/route.ts`
- Method(s): `POST` (`15-79`), `DELETE` (`80-101`)
- Entry/Auth: `17-18`, `82-83`
- Validation: `17-39`, `82-82`
- DB reads/writes: `46-74`, `80-97`
- AI/external calls: none detected
- Response/errors: `17-76`, `82-99`

#### File: `app/api/user/role/route.ts`
- Method(s): `PATCH` (`7-57`)
- Entry/Auth: `10-55`
- Validation: `9-48`
- DB reads/writes: `30-33`
- AI/external calls: none detected
- Response/errors: `10-55`

#### File: `app/api/user/delete-account/route.ts`
- Method(s): `POST` (`6-35`)
- Entry/Auth: `8-15`
- Validation: `8-8`
- DB reads/writes: `10-31`
- AI/external calls: none detected
- Response/errors: `8-33`

### System and Dev

#### File: `app/api/dev/plan/route.ts`
- Method(s): `PATCH` (`11-39`)
- Entry/Auth: `17-17`
- Validation: `17-21`
- DB reads/writes: `28-31`
- AI/external calls: none detected
- Response/errors: `13-37`

#### File: `app/api/auto-jobs/route.ts`
- Method(s): `POST` (`121-243`)
- Entry/Auth: `124-216`
- Validation: `123-239`
- DB reads/writes: `221-222`
- AI/external calls: none detected in range map (AI helper calls exist by imports)
- Response/errors: `124-235`

#### File: `app/api/auto-jobs/history/route.ts`
- Method(s): `GET` (`5-25`)
- Entry/Auth: `8-8`
- Validation: `7-14`
- DB reads/writes: `11-12`
- AI/external calls: none detected
- Response/errors: `8-23`

### Recruiter Domain

#### File: `app/api/recruiter/applications/route.ts`
- Method(s): `GET` (`5-39`)
- Entry/Auth: `7-8`
- Validation: `7-30`
- DB reads/writes: `16-17`
- AI/external calls: none detected
- Response/errors: `7-37`

#### File: `app/api/recruiter/applications/[id]/route.ts`
- Method(s): `GET` (`6-35`), `PATCH` (`36-83`), `DELETE` (`84-108`)
- Entry/Auth: `11-12`, `41-42`, `89-90`
- Validation: `8-17`, `38-68`, `86-95`
- DB reads/writes: `19-20`, `70-73`, `84-100`
- AI/external calls: none detected
- Response/errors: `11-33`, `41-81`, `89-106`

#### File: `app/api/recruiter/applications/[id]/interview/route.ts`
- Method(s): `POST` (`7-69`), `PATCH` (`70-133`), `DELETE` (`134-167`)
- Entry/Auth: `12-13`, `75-76`, `139-140`
- Validation: `9-45`, `72-111`, `136-145`
- DB reads/writes: `49-52`, `118-121`, `134-150`
- AI/external calls: none detected
- Response/errors: `12-67`, `75-131`, `139-165`

#### File: `app/api/recruiter/applications/[id]/screen/route.ts`
- Method(s): `POST` (`32-104`)
- Entry/Auth: `37-38`
- Validation: `34-84`
- DB reads/writes: `48-93`
- AI/external calls: none detected in range map (AI helper calls exist by imports)
- Response/errors: `37-102`

#### File: `app/api/recruiter/candidates/route.ts`
- Method(s): `GET` (`67-159`)
- Entry/Auth: `69-94`
- Validation: `69-157`
- DB reads/writes: `85-87`
- AI/external calls: none detected
- Response/errors: `69-157`

#### File: `app/api/recruiter/candidates/[id]/route.ts`
- Method(s): `GET` (`6-49`)
- Entry/Auth: `11-33`
- Validation: `8-43`
- DB reads/writes: `21-22`
- AI/external calls: none detected
- Response/errors: `11-47`

#### File: `app/api/recruiter/candidates/[id]/similar/route.ts`
- Method(s): `GET` (`6-33`)
- Entry/Auth: `12-16`
- Validation: `8-21`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `12-30`

#### File: `app/api/recruiter/company/route.ts`
- Method(s): `GET` (`7-32`), `POST` (`33-106`)
- Entry/Auth: `10-14`, `36-40`
- Validation: `9-9`, `35-70`
- DB reads/writes: `17-18`, `81-82`
- AI/external calls: none detected
- Response/errors: `10-28`, `36-104`

#### File: `app/api/recruiter/company/[id]/route.ts`
- Method(s): `GET` (`9-41`), `PATCH` (`42-113`), `DELETE` (`114-145`)
- Entry/Auth: `15-19`, `48-52`, `120-124`
- Validation: `11-23`, `44-96`, `116-128`
- DB reads/writes: `27-28`, `98-101`, `114-135`
- AI/external calls: none detected
- Response/errors: `15-39`, `48-111`, `120-143`

#### File: `app/api/recruiter/company/[id]/logo/route.ts`
- Method(s): `POST` (`15-101`), `DELETE` (`102-148`)
- Entry/Auth: `20-22`, `107-109`
- Validation: `17-47`, `104-113`
- DB reads/writes: `54-88`, `102-136`
- AI/external calls: none detected
- Response/errors: `20-98`, `107-146`

#### File: `app/api/recruiter/jobs/route.ts`
- Method(s): `GET` (`6-28`), `POST` (`29-130`)
- Entry/Auth: `9-12`, `32-35`
- Validation: `8-8`, `31-82`
- DB reads/writes: `15-16`, `96-97`
- AI/external calls: none detected
- Response/errors: `9-26`, `32-128`

#### File: `app/api/recruiter/jobs/[id]/route.ts`
- Method(s): `GET` (`6-37`), `PATCH` (`38-115`), `DELETE` (`116-146`)
- Entry/Auth: `12-15`, `44-47`, `122-125`
- Validation: `8-19`, `40-98`, `118-129`
- DB reads/writes: `23-24`, `100-103`, `116-136`
- AI/external calls: none detected
- Response/errors: `12-35`, `44-113`, `122-144`

#### File: `app/api/recruiter/jobs/[id]/auto-shortlist/route.ts`
- Method(s): `POST` (`34-172`)
- Entry/Auth: `40-43`
- Validation: `36-135`
- DB reads/writes: `56-155`
- AI/external calls: none detected in range map (AI helper calls exist by imports)
- Response/errors: `40-167`

#### File: `app/api/recruiter/jobs/[id]/optimize/route.ts`
- Method(s): `POST` (`33-101`)
- Entry/Auth: `39-42`
- Validation: `35-83`
- DB reads/writes: `55-57`
- AI/external calls: none detected in range map (AI helper calls exist by imports)
- Response/errors: `39-98`

#### File: `app/api/recruiter/jobs/generate-description/route.ts`
- Method(s): `POST` (`47-159`)
- Entry/Auth: `50-53`
- Validation: `49-140`
- DB reads/writes: none detected
- AI/external calls: none detected in range map (AI helper calls exist by imports)
- Response/errors: `50-155`

#### File: `app/api/recruiter/templates/route.ts`
- Method(s): `GET` (`15-37`), `POST` (`38-97`)
- Entry/Auth: `18-21`, `41-44`
- Validation: `17-17`, `40-70`
- DB reads/writes: `24-25`, `77-78`
- AI/external calls: none detected
- Response/errors: `18-35`, `41-95`

#### File: `app/api/recruiter/templates/[id]/route.ts`
- Method(s): `GET` (`14-45`), `PATCH` (`46-121`), `DELETE` (`122-152`)
- Entry/Auth: `20-23`, `52-55`, `128-131`
- Validation: `16-27`, `48-96`, `124-135`
- DB reads/writes: `31-32`, `106-109`, `122-142`
- AI/external calls: none detected
- Response/errors: `20-43`, `52-119`, `128-150`

#### File: `app/api/recruiter/alerts/route.ts`
- Method(s): `GET` (`8-25`), `POST` (`26-59`)
- Entry/Auth: `10-12`, `28-30`
- Validation: `10-10`, `28-43`
- DB reads/writes: `15-16`, `45-46`
- AI/external calls: none detected
- Response/errors: `10-23`, `28-57`

#### File: `app/api/recruiter/alerts/[id]/route.ts`
- Method(s): `DELETE` (`6-29`), `PATCH` (`30-68`)
- Entry/Auth: `11-13`, `35-37`
- Validation: `8-17`, `32-50`
- DB reads/writes: `6-22`, `56-59`
- AI/external calls: none detected
- Response/errors: `11-27`, `35-66`

#### File: `app/api/recruiter/resumes/[resumeId]/analyze/route.ts`
- Method(s): `POST` (`13-104`)
- Entry/Auth: `19-52`
- Validation: `15-66`
- DB reads/writes: `35-85`
- AI/external calls: none detected in route file
- Response/errors: `19-102`

#### File: `app/api/recruiter/resumes/[resumeId]/download/route.ts`
- Method(s): `GET` (`10-63`)
- Entry/Auth: `16-44`
- Validation: `12-44`
- DB reads/writes: `27-53`
- AI/external calls: none detected
- Response/errors: `16-61`

#### File: `app/api/recruiter/instant-shortlist/route.ts`
- Method(s): `POST` (`10-51`)
- Entry/Auth: `12-14`
- Validation: `12-33`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `12-49`

#### File: `app/api/recruiter/top-candidates/route.ts`
- Method(s): `GET` (`6-29`)
- Entry/Auth: `9-12`
- Validation: `8-18`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `9-26`

#### File: `app/api/recruiter/intelligence/route.ts`
- Method(s): `GET` (`6-24`)
- Entry/Auth: `9-12`
- Validation: `8-8`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `9-21`

#### File: `app/api/recruiter/salary-estimate/route.ts`
- Method(s): `POST` (`30-127`)
- Entry/Auth: `33-36`
- Validation: `32-101`
- DB reads/writes: none detected
- AI/external calls: none detected in range map (AI helper calls exist by imports)
- Response/errors: `33-124`

#### File: `app/api/recruiter/skill-gap/route.ts`
- Method(s): `POST` (`31-160`)
- Entry/Auth: `34-37`
- Validation: `33-138`
- DB reads/writes: `52-99`
- AI/external calls: none detected in range map (AI helper calls exist by imports)
- Response/errors: `34-157`

#### File: `app/api/recruiter/push/route.ts`
- Method(s): `POST` (`8-72`)
- Entry/Auth: `11-14`
- Validation: `10-66`
- DB reads/writes: none detected
- AI/external calls: none detected
- Response/errors: `11-70`

#### File: `app/api/recruiter/messages/route.ts`
- Method(s): none (stub/no exported handlers)
- Entry/Auth: none detected in active method blocks
- Validation: none detected in active method blocks
- DB reads/writes: none detected in active method blocks
- AI/external calls: none detected
- Response/errors: no finalized handler response path exported

---

## 17. Full `/lib` Line-Range Functionality Catalog (Architecture-Critical)

### Auth and Supabase Foundation

#### File: `lib/auth.ts`
- Exports: `getUser()`, `ensureUserRow()`, and profile-related types (`L5-L16`, `L19-L23`, `L61-L67`).
- `L24-L29`: checks E2E cookie role override before default auth path.
- `L31-L36`: loads current auth user; returns null if user/email missing.
- `L37-L51`: queries `users` profile; if absent, calls `ensureUserRow()` and re-fetches profile.
- `L53-L57`: returns normalized `{ id, email, profile }` object.
- `L61-L66`: upserts default user row (`free`, `job_seeker`) with conflict-safe behavior.

#### File: `lib/supabase/client.ts`
- Exports browser `createClient()` (`L3-L8`).
- `L5-L6`: reads required public env vars.
- `L4-L8`: creates browser Supabase client via SSR helper.

#### File: `lib/supabase/server.ts`
- Exports server `createClient()` (`L6-L29`).
- `L7`: gets Next cookie store.
- `L9-L13`: builds server client with URL/key.
- `L14-L25`: cookie bridge (`getAll`, guarded `setAll`).
- `L17-L24`: try/catch avoids Server Component cookie mutation crashes.

#### File: `lib/supabase/admin.ts`
- Exports `createServiceRoleClient()` (`L4-L11`).
- `L5-L7`: validates admin env vars.
- `L7`: returns null if config missing.
- `L8-L10`: creates service-role client with session persistence disabled.

### AI Stack and Caching

#### File: `lib/ai.ts`
- Exports routing and cache wrapper functions (`L20-L24`, `L48-L98`, `L100-L112`).
- `L5-L14`: detects quota/rate-limit errors by message patterns.
- `L25-L36`: Gemini-first generation with OpenAI fallback on rate/quota class failures.
- `L62-L70`: cached system+user path (hash -> read cache -> generate -> set cache).
- `L89-L97`: cached prompt-only path.
- `L39-L42`, `L61-L71`, `L88-L98`: returns include `fromCache` metadata in meta variants.

#### File: `lib/openai.ts`
- Exports `isOpenAIAvailable()`, `chatCompletion()` (`L16-L18`, `L20-L36`).
- `L3-L13`: lazy singleton client init.
- `L7-L10`: explicit throw if `OPENAI_API_KEY` missing.
- `L26-L33`: requests `gpt-4o-mini` with optional JSON response format.
- `L34-L35`: returns first message content.

#### File: `lib/gemini.ts`
- Exports `isGeminiAvailable()`, `geminiGenerate()`, `geminiGenerateContent()` (`L16-L18`, `L24-L56`).
- `L3-L13`: lazy singleton init.
- `L7-L10`: explicit throw if `GEMINI_API_KEY` missing.
- `L24-L44`: system+user composition path with optional JSON mode.
- `L49-L56`: prompt-only generation path.
- `L40-L42`, `L54`: empty text responses treated as errors.

#### File: `lib/aiCache.ts`
- Exports key cache helpers (`L19-L25`, `L30-L49`, `L54-L81`).
- `L5-L13`: feature TTL map and default TTL.
- `L20-L24`: normalized hash generation for deterministic cache keys.
- `L33-L38`: reads unexpired cache entries from `ai_cache`.
- `L71-L77`: upserts cache rows with computed expiry.
- `L46-L48`, `L78-L80`: fail-soft cache behavior (non-critical on errors).

### Usage, Rate Limiting, Validation, and Error Utilities

#### File: `lib/usage.ts`
- Exports usage count/limits/summary functions (`L11-L188`).
- `L16-L18`, `L139-L148`: monthly window and feature list setup.
- `L40-L51`, `L65-L76`: free-plan vs paid-plan branching.
- `L83-L125`: atomic check+log with rollback when limit exceeded.
- `L20-L26`, `L84-L87`, `L95-L101`, `L168-L176`: `usage_logs` DB operations.
- `L88-L92`, `L104-L106`: insert/count failure fallbacks.

#### File: `lib/usage-limits.ts`
- Exports `FeatureType` and `FREE_PLAN_LIMITS` map (`L5-L24`).
- `L1-L4`: client-safe shared config purpose.
- `L15-L24`: per-feature free monthly caps.

#### File: `lib/rateLimit.ts`
- Exports `checkRateLimit()`, `checkRecipientSearchRateLimit()` (`L53-L75`).
- `L9-L10`: default 1-minute/10-request window.
- `L27-L47`: sliding-window check and usage token insert.
- `L24-L32`, `L45`: DB-backed usage log queries/inserts.
- `L34-L37`, `L48-L50`: fail-open behavior on query/exception.
- `L69-L74`: recipient search uses dedicated config values.

#### File: `lib/validation.ts`
- Exports UUID, redirect, HTML, text-length, and action-type validators (`L4-L79`).
- `L19-L29`: redirect sanitizer blocks dangerous redirect forms/schemes.
- `L51-L63`: generic text-length validator returns `{ valid, text, error }`.
- `L33-L40`: HTML escaping helper.
- `L66-L75`: action-type allowlist enforcement.

#### File: `lib/api-error.ts`
- Exports API error parsing/formatting helpers (`L5-L56`).
- `L11-L23`: robust JSON-or-text error body parsing.
- `L34-L39`: error/detail message composition.
- `L42-L56`: parses JSON-like thrown error messages from `apiFetch`.

### Resume Processing

#### File: `lib/resumeStructurer.ts`
- Exports `getOrCreateStructuredResume()`, `structuredToSkills()` (`L52-L114`, `L119-L121`).
- `L6-L47`: strict structured-resume extraction prompt definition.
- `L59-L71`: returns cached `structured_json` when available.
- `L66`, `L74`: early null returns for missing resume/parsed text.
- `L79-L98`: AI extraction + fenced JSON cleanup + normalization.
- `L103-L112`: persists structured JSON, then non-blocking graph/badge sync.

#### File: `lib/ats-resume-analysis.ts`
- Exports ATS prompt constants + parser/executor (`L4-L88`).
- `L4-L51`: baseline and recheck prompt templates.
- `L53-L65`: result parser with score clamping and list caps.
- `L76-L84`: chooses recheck prompt when prior analysis provided.
- `L86`: AI cached call using `resume_analysis` feature key.

#### File: `lib/resume-for-user.ts`
- Exports user-scoped resume retrieval helpers (`L13-L17`, `L38-L43`, `L62-L64`, `L67-L94`).
- `L18-L23`, `L43-L48`, `L72-L77`: ownership-scoped DB lookups.
- `L25-L32`, `L50-L57`, `L79-L87`: typed failure branches (`not_found`, `empty_text`, etc.).
- `L83-L85`: improved resume JSON normalization + plaintext conversion.

### Auto-Apply and Smart-Apply Engines

#### File: `lib/autoApplyEngine.ts`
- Exports `runAutoApply()` (`L198-L291`) and internal helper functions.
- `L37-L77`: Adzuna fetch integration and normalization.
- `L79-L113`: internal job fetch from `job_postings`.
- `L115-L187`: deep-match AI call + fallback result path.
- `L203-L206`: execution timeout guard (2 minutes).
- `L218-L283`: orchestration pipeline (resume structuring -> fetch -> rank -> deep match -> finalize).
- `L285-L290`: failure handling updates run status to `failed`.

#### File: `lib/smartApplyEngine.ts`
- Exports `getActiveSmartRules()`, `executeSmartRule()`, `runAllSmartRules()` (`L14-L26`, `L33-L247`, `L252-L270`).
- `L18-L23`: active rule query by enabled + schedule due.
- `L41-L75`: daily/weekly cap checks and early exits.
- `L80-L114`: run creation and auto-apply execution.
- `L131-L151`: qualification filters (score, salary, location/remote).
- `L156-L229`: application inserts, rule counter updates, notifications.
- `L243-L246`: structured error return path.

### Messaging and Notifications

#### File: `lib/notifications.ts`
- Exports `createNotification()`, `createNotificationForUser()` (`L7-L13`, `L32-L38`).
- `L15-L23`: current-user notification insert path.
- `L39-L46`: service-role availability check for cross-user inserts.
- `L48-L54`: cross-user notification insert.
- `L23-L25`, `L55-L61`: non-blocking error logging strategy.

#### File: `lib/message-attachments.ts`
- Exports attachment constants and helper functions (`L3-L53`).
- `L5-L18`: bucket, MIME allowlist, size cap, signed URL TTL.
- `L19-L26`: ownership check for attachment paths.
- `L28-L32`: filename sanitization.
- `L41-L44`: signed URL generation from Supabase storage.
- `L44-L49`: fallback to `attachment_url: null` on signing failure.

### Recruiter Intelligence Stack

#### File: `lib/recruiterIntelligence.ts`
- Exports recruiter analytics builder (`L36-L184`).
- `L41-L51`: loads recruiter apps and active jobs.
- `L55-L91`: conversion and time-to-hire metrics.
- `L95-L133`: source/job performance aggregation and ranking.
- `L135-L160`: heuristic recommendation generation.
- `L162-L183`: returns structured intelligence payload.

#### File: `lib/recruiterPush.ts`
- Exports push send/read/update APIs (`L22-L99`).
- `L32-L43`: daily push limit enforcement.
- `L46-L57`: push row insertion.
- `L59-L66`: companion notification creation.
- `L79-L87`: candidate push retrieval.
- `L93-L99`: mark push as read.

#### File: `lib/recruiterAutoPush.ts`
- Exports `autoPushCandidatesForJob()` and `runDailyRecruiterAutoPush()` (`L8-L15`, `L101-L134`).
- `L18-L20`: empty-skill fast return.
- `L22-L58`: candidate overlap and ranking prep.
- `L72-L92`: send pushes to shortlisted candidates.
- `L107-L131`: cron-style active-job sweep and aggregate push counts.

#### File: `lib/instantShortlist.ts`
- Exports `getInstantShortlist()` (`L40-L150`).
- `L50-L54`: input normalization + early exit.
- `L57-L84`: candidate skill matching and overlap grouping.
- `L109-L134`: weighted scoring and missing-skill diff.
- `L137-L142`: boosted-first sort and score ordering.
- `L144-L149`: result truncation with metadata.

### Analytics Engines

#### File: `lib/resumePerformance.ts`
- Exports resume performance and hiring benchmark generators (`L32-L333`).
- `L35-L51`: parallel data loading for resumes/apps/runs.
- `L57-L156`: per-resume metric computation.
- `L158-L243`: insight extraction (best resume, score thresholds, role patterns, optimal apply volume).
- `L260-L319`: percentile benchmark and top-factor derivation.
- `L53-L55`, `L321-L332`: empty-state fallback results.

#### File: `lib/skillDemand.ts`
- Exports demand dashboard + refresh pipeline (`L25-L190`).
- `L31-L40`: current-month demand load.
- `L45-L66`: trending/declining/high-pay/high-demand/user-skill slices.
- `L104-L119`: refresh inputs (jobs, supply, prior baseline).
- `L121-L187`: aggregate demand/supply/trend calculations + upsert.
- `L189`: processed-skill count return.

### Streak, Daily Actions, Opportunity Alerts

#### File: `lib/streakSystem.ts`
- Exports streak lifecycle helpers (`L64-L269`).
- `L16-L37`: streak levels, milestones, XP map.
- `L67-L94`: current streak retrieval + derived fields.
- `L117-L175`: update branches (first action, same-day, consecutive, freeze recovery, reset).
- `L185-L253`: DB writes + XP award with optimistic-concurrency retries.
- `L258-L269`: leaderboard query.

#### File: `lib/dailyActions.ts`
- Exports action generation/completion/progress (`L44-L341`).
- `L48-L63`: reuse existing daily actions vs generate new.
- `L91-L169`: context collector from resumes/apps/interviews/matches/pushes/streak.
- `L186-L295`: rule-based action builder and prioritization.
- `L75-L82`, `L306-L314`, `L327-L335`: insert/update/progress DB operations.
- `L343-L369`: action routing map helper.

#### File: `lib/opportunityAlerts.ts`
- Exports alert CRUD/create/scan pipeline (`L21-L246`).
- `L28-L37`, `L48-L53`, `L63-L68`: active read, dismiss, mark-seen primitives.
- `L82-L121`: high-match alert creation with dedupe and notification.
- `L127-L172`: low-competition and recruiter-interest creation helpers.
- `L185-L243`: scanner orchestration over recent runs + unread pushes.
- `L245`: returns total alerts created.

### Storage and Upload Helpers

#### File: `lib/image-upload-validate.ts`
- Exports image constraints and signature helpers (`L3-L35`).
- `L6-L21`: JPEG/PNG/WebP signature checks.
- `L23-L29`: MIME-specific magic-byte validation branch.
- `L31-L35`: MIME-to-extension mapping helper.

#### File: `lib/avatar-storage.ts`
- Exports `avatarStoragePathFromPublicUrl()` (`L2-L8`).
- `L4`: marker-based URL parsing strategy.
- `L3`, `L6`: null returns for invalid/unsupported URLs.
- `L7`: strips query params from path.

#### File: `lib/company-logo-storage.ts`
- Exports `companyLogoStoragePathFromPublicUrl()` (`L2-L8`).
- `L4`: marker-based parsing for `company-logos`.
- `L3`, `L6`: guard rails for invalid inputs.
- `L7`: returns clean storage object path.

---

## 18. Full `hooks` Line-Range Catalog (Queries, Mutations, Realtime)

### Top-level messaging hooks

#### File: `hooks/use-messaging-typing.ts`
- Exports: `useMessagingTyping` (`11-82`)
- `16-37`: realtime channel setup and room keying.
- `31-35`: broadcast receive handler for typing events.
- `39-52`: cleanup path and inactive broadcast on unmount.
- `55-70`: send typing event function with guarded error handling.
- `72-79`: idle timeout logic.

#### File: `hooks/use-messaging-read-sync.ts`
- Exports: `useMessagingReadSync` (`13-72`)
- `17-43`: channel setup + subscription.
- `27-40`: read event handling and query invalidation.
- `33-39`: invalidates thread/messages/unread summary caches.
- `51-69`: peer-read notify broadcast path.
- `60-64`: safe error swallowing on broadcast failures.

### Query hooks (selected architecture-critical)

#### File: `hooks/queries/recruiter-keys.ts`
- Exports: `recruiterKeys` (`1-20`)
- `7-14`: messaging/thread/unread key builders.
- `3-6`, `15-19`: recruiter key namespaces (jobs, applications, candidates, etc.).

#### File: `hooks/queries/shared-query-keys.ts`
- Exports: `sharedQueryKeys` (`4-7`)
- `4-7`: shared resume query key contract.

#### File: `hooks/queries/use-messages.ts`
- Exports: `useMessages` (`14-127`)
- `19-21`: infinite query key setup.
- `22-44`: paginated fetch function and cursor behavior.
- `66-115`: realtime invalidation orchestration.
- `76-82`: shared invalidate helper.
- `106-110`: channel error logging path.

#### File: `hooks/queries/use-thread-messages.ts`
- Exports: `useThreadMessages` (`22-139`)
- `27-30`: query key and disabled-state fallback key.
- `31-44`: query function + next-page extraction.
- `47-105`: realtime event-driven invalidation for active thread.
- `54-60`: thread invalidate helper.
- `62-99`: event filtering and guard clauses.

#### File: `hooks/queries/use-message-unread-summary.ts`
- Exports: `useMessageUnreadSummary` (`9-18`)
- `10-13`: unread summary query and fetch mapping.
- `14-16`: polling fallback configuration.

#### File: `hooks/queries/use-message-unread-realtime.ts`
- Exports: `useMessageUnreadRealtime` (`15-87`)
- `10-37`: dedupe/ref-count guard for subscriptions.
- `40-43`: invalidate helper for unread + messages.
- `45-67`: INSERT/UPDATE realtime subscriptions.
- `67-73`: channel error logging.
- `77-85`: cleanup and channel removal.

#### File: `hooks/queries/use-message-unread-state.ts`
- Exports: `useMessageUnreadState` (`16-34`)
- `17-19`: composition of realtime hook + unread summary query.
- `20-25`: derived total unread calculation.
- `31-33`: error propagation.

#### File: `hooks/queries/use-notifications.ts`
- Exports: `useNotifications` (`22-29`), `useMarkAllRead` (`31-47`), `useMarkRead` (`49-65`)
- `17-20`: notification query key namespace.
- `23-28`: notification list fetch with safe fallback.
- `34-39`: mark-all mutation function.
- `40-45`: optimistic cache write + invalidation.
- `52-57`: single mark-read mutation function.
- `58-63`: targeted cache update + invalidation.

#### File: `hooks/queries/use-applications.ts`
- Exports: `useApplications` (`12-18`), `useDeleteApplication` (`20-29`), `useUpdateApplicationStatus` (`31-44`), `useSaveApplication` (`46-70`)
- `7-10`: applications key setup.
- `13-17`: list query.
- `23-24`, `34-39`, `49-65`: delete/status/save mutation functions.
- `25-27`, `40-42`, `66-68`: invalidation after mutations.

#### File: `hooks/queries/use-job-board.ts`
- Exports: `useJobs` (`67-82`), `useAppliedJobIds` (`84-90`), `useJobBoardResumes` (`92-102`), `useJobBoardImprovedResumes` (`104-116`), `useApplyToJob` (`118-146`)
- `59-65`: `jobBoardKeys` setup.
- `70-79`, `85-88`, `95-98`, `107-112`: fetch functions.
- `121-140`: apply mutation function.
- `141-144`: invalidation after apply.

#### File: `hooks/queries/use-auto-apply.ts`
- Exports: `usePastRuns` (`13-19`), `useAutoApplyRun` (`21-32`), `useStartAutoApply` (`34-47`), `usePatchAutoApplySelections` (`49-69`), `useConfirmAutoApply` (`71-85`)
- `7-11`: key namespace.
- `16-17`, `26-31`: run list/detail fetch.
- `37-42`, `52-63`, `74-78`: mutation functions.
- `43-45`, `64-67`, `79-83`: invalidation paths.

#### File: `hooks/queries/use-dashboard.ts`
- Exports: `useDashboardStats` (`24-30`), `useHistory` (`39-45`)
- `6-11`: dashboard key map.
- `25-29`: stats fetch.
- `40-44`: history fetch.

### Mutation hooks (selected architecture-critical)

#### File: `hooks/mutations/use-analyze-resume.ts`
- Exports: `useAnalyzeResume` (`42-52`)
- `25-40`: mutation wrapper/API call + error humanization.
- `45`: mutation function binding.
- `46-50`: invalidation after success.

#### File: `hooks/mutations/use-improve-resume.ts`
- Exports: `useImproveResume` (`51-61`)
- `27-49`: mutation function wrapper.
- `54`: mutation binding.
- `55-59`: invalidations.

#### File: `hooks/mutations/use-upload-resume.ts`
- Exports: `useUploadResume` (`37-46`)
- `18-35`: upload flow + size guard.
- `40`: mutation binding.
- `41-44`: invalidations.

#### File: `hooks/mutations/use-import-linkedin.ts`
- Exports: `useImportLinkedIn` (`22-32`)
- `10-20`: mutation function wrapper.
- `26-30`: invalidation on success.

#### File: `hooks/mutations/use-auto-jobs.ts`
- Exports: `useAutoJobsSearch` (`36-46`)
- `18-34`: search mutation function.
- `40-44`: invalidation logic.

#### File: `hooks/mutations/use-job-match.ts`
- Exports: `useJobMatch` (`40-50`)
- `23-38`: mutation function.
- `44-48`: invalidations.

#### File: `hooks/mutations/use-generate-cover-letter.ts`
- Exports: `useGenerateCoverLetter` (`56-66`)
- `28-54`: generation mutation wrapper.
- `60-64`: invalidation logic.

#### File: `hooks/mutations/use-cover-letter-crud.ts`
- Exports: `useCoverLetterContent` (`14-19`), `usePatchCoverLetter` (`21-34`), `useDeleteCoverLetter` (`36-45`)
- `16-17`: content fetch mutation.
- `24-29`: patch mutation.
- `30-32`: patch invalidation.
- `39-40`: delete mutation.
- `41-43`: delete invalidation.

#### File: `hooks/mutations/use-public-landing.ts`
- Exports: `usePublicExtractResume` (`17-21`), `usePublicFresherResume` (`23-40`)
- `6-15`: public extract API call with explicit throw handling.
- `25-38`: fresher resume generation mutation.

---

## 19. Components and Pages UI-to-API Wiring Map

### Resume Domain

#### File: `app/(dashboard)/resume-analyzer/page.tsx`
- User actions: upload/paste resume, analyze ATS, improve resume, re-check.
- Hooks: `useAnalyzeResume`, `useImproveResume`, persisted read hooks.
- APIs: `POST /api/analyze-resume`, `POST /api/improve-resume`.
- Side effects: dashboard/history usage refresh via hook invalidations.
- Local state: input mode, text/id, analysis/improved states, intent/errors.

#### File: `components/resume/ResumeUpload.tsx`
- User actions: drag/drop upload.
- Hooks: `useUploadResume`.
- API: `POST /api/upload-resume`.
- Side effects: query invalidation for resume-dependent views.
- Local state: drag/upload/error.

#### File: `components/resume/ImprovedResumeView.tsx`
- User actions: copy, export DOCX/PDF.
- Hooks/APIs: direct fetch to improved-resume export/download endpoints.
- Side effects: clipboard writes, print/download.
- Local state: action-specific status/errors.

### Jobs Domain

#### File: `app/(dashboard)/job-match/page.tsx`, `components/job/JobMatchForm.tsx`
- User actions: resume-vs-JD comparison.
- Hooks: `useJobMatch`, persisted match hooks.
- API: `POST /api/job-match`.
- Side effects: history/dashboard invalidation.
- Local state: form fields, result state.

#### File: `app/(dashboard)/job-finder/page.tsx`, `components/job-finder/JobFinderForm.tsx`
- User actions: run job finder from resume.
- Hooks: `useUploadResume`, `useAutoJobsSearch`.
- APIs: `POST /api/upload-resume`, `POST /api/auto-jobs`.
- Side effects: dashboard refresh.
- Local state: text/location/progress/errors.

#### File: `app/(dashboard)/job-board/page.tsx`
- User actions: filter jobs, open details, apply, generate cover letters.
- Hooks: `useJobs`, `useAppliedJobIds`, `useApplyToJob`, `useGenerateCoverLetter`, resume selection hooks.
- APIs: `GET /api/jobs`, `GET /api/jobs/applied`, `POST /api/jobs/{id}/apply`, `POST /api/generate-cover-letter`.
- Side effects: invalidates applied jobs and tracker apps.
- Local state: filters, modals, selected resume source, apply status.

### Auto-Apply Domain

#### File: `app/(dashboard)/auto-apply/page.tsx`
- User actions: start and monitor runs.
- Hooks: `usePastRuns`, `useStartAutoApply`, `useAutoApplyRun`.
- APIs: `GET /api/auto-apply`, `POST /api/auto-apply`, `GET /api/auto-apply/{id}`.
- Side effects: polling + refresh on terminal states.
- Local state: active run, starting/error states.

#### File: `components/auto-apply/AutoApplyResults.tsx`
- User actions: select jobs, save selection, confirm apply.
- Hooks: `usePatchAutoApplySelections`, `useConfirmAutoApply`.
- APIs: `PATCH /api/auto-apply/{id}`, `POST /api/auto-apply/{id}/confirm`.
- Side effects: invalidates run and applications caches.
- Local state: selection set, confirmation states, errors.

#### File: `app/(dashboard)/smart-apply/page.tsx`
- User actions: create/update/toggle smart rules.
- Hooks: smart-apply rules and mutations + usage/resume queries.
- APIs: `GET/POST/PATCH /api/smart-apply`, `GET /api/upload-resume`, `GET /api/usage`.
- Side effects: rules invalidation and status refresh.
- Local state: full rule form state and feedback banners.

### Recruiter Domain

#### File: `app/(recruiter)/recruiter/jobs/page.tsx`
- User actions: list, filter, pause/resume, delete jobs.
- Hooks: recruiter jobs + status/delete mutations.
- APIs: `GET /api/recruiter/jobs`, `PATCH /api/recruiter/jobs/{id}`, `DELETE /api/recruiter/jobs/{id}`.
- Side effects: jobs query invalidation.
- Local state: filters and selected actions.

#### File: `app/(recruiter)/recruiter/candidates/page.tsx`
- User actions: candidate search/filter/pagination.
- Hooks: `useRecruiterCandidatesSearch`.
- API: `GET /api/recruiter/candidates`.
- Side effects: navigation to messages with recipient context.
- Local state: draft vs committed filters, page state.

#### File: `app/(recruiter)/recruiter/applications/page.tsx`
- User actions: move candidates through pipeline, trigger AI screening.
- Hooks: `useRecruiterApplications`, `useUpdateApplicationStage`, `useScreenApplication`.
- APIs: `GET /api/recruiter/applications`, `PATCH /api/recruiter/applications/{id}`, `POST /api/recruiter/applications/{id}/screen`.
- Side effects: invalidation after stage/screen updates.
- Local state: view mode, expanded cards, in-flight screen id.

#### File: `app/(recruiter)/recruiter/company/page.tsx`
- User actions: edit company profile, upload/delete logo.
- Hooks: company query + save/logo mutation hooks.
- APIs: `GET/POST/PATCH /api/recruiter/company`, `POST/DELETE /api/recruiter/company/{id}/logo`.
- Side effects: invalidates recruiter user/company data.
- Local state: form fields and save/upload states.

### Messaging Domain

#### File: `components/messages/MessagesInbox.tsx`
- User actions: inbox browsing, thread read/send, attachments, typing/read sync.
- Hooks: `useMessages`, `useThreadMessages`, `useSendMessage`, unread hooks, typing/read-sync hooks.
- APIs: `GET /api/messages`, `GET /api/messages/thread`, `POST /api/messages`, `POST /api/messages/attachment`, `POST /api/messages/mark-read`, `GET /api/messages/unread-summary`.
- Side effects: heavy cache invalidation, optimistic unread updates, router query updates, realtime channel sync.
- Local state: selected peer, compose/reply text, attachments, scroll/typing indicators.

#### File: `components/messages/RecipientPicker.tsx`
- User actions: search/select recipient.
- Hooks/APIs: direct recipient search API.
- API: `GET /api/messages/recipient-search`.
- Side effects: debounced requests and dropdown visibility management.
- Local state: query/results/loading/open-state.

### Dashboard Domain

#### File: `app/(dashboard)/dashboard/page.tsx`
- User actions: consume summary metrics and launch actions.
- Hooks: dashboard stats and child widget hooks.
- APIs: `GET /api/dashboard` plus child widget endpoints.
- Side effects: independent query refresh per widget.
- Local state: mostly derived display state.

#### File: `components/dashboard/OpportunityAlerts.tsx`
- Hooks: `useOpportunityAlerts`, `useTriggerAlertScan`, `useDismissAlert`.
- APIs: `GET /api/opportunity-alerts`, `POST /api/opportunity-alerts/scan`, `PATCH /api/opportunity-alerts`.
- Side effects: scan on mount and dismiss invalidation.

#### File: `components/dashboard/DailyActions.tsx`
- Hooks: `useDailyActions`, `useCompleteDailyAction`.
- APIs: `GET/PATCH /api/daily-actions`.
- Side effects: invalidates daily actions after completion.

### Settings Domain

#### File: `app/(dashboard)/settings/page.tsx` and `SettingsForm.tsx`
- User actions: update profile/preferences, avatar operations, delete account.
- Hooks: `useUser`, `useUpdateUser`, avatar hooks, `useDeleteAccount`.
- APIs: `GET/PATCH /api/user`, avatar endpoints, delete-account endpoint.
- Side effects: cache refresh and route refresh on updates.
- Local state: controlled form and action status flags.

### Landing Domain

#### File: `app/page.tsx`
- User actions: audience mode switch.
- Hooks/APIs: local state only.
- Side effects: CTA/link target switching.

#### File: `components/landing/HeroResumeCTA.tsx`
- User actions: upload/paste resume from landing funnel.
- Hooks: `usePublicExtractResume`.
- API: `POST /api/public/extract-resume`.
- Side effects: stores draft in sessionStorage and navigates to signup.
- Local state: flow mode, drag/upload/progress/errors.

#### File: `components/landing/CreateResumeFresherFlow.tsx`
- User actions: stepwise fresher profile input and AI resume generation.
- Hooks: `usePublicFresherResume`.
- API: `POST /api/public/fresher-resume`.
- Side effects: stores generated draft in sessionStorage.
- Local state: step machine, input model, generation state/errors.

---

## 20. Database Table-by-Table Execution Matrix

This matrix maps **table purpose -> write paths -> read paths -> execution constraints**.

| Table | Primary purpose | Write paths (API + libs) | Read paths (API + hooks/pages) | Notable constraints / policies / indexes |
|---|---|---|---|---|
| `users` | Identity/profile/role/plan/public profile | `/api/user`, `/api/user/role`, `/api/dev/plan`, auth callback; `lib/auth.ts`, `lib/streakSystem.ts`, `lib/recalculate-profile-strength.ts` | `/api/user`, `/api/profile`, recruiter candidate APIs, `app/u/[slug]/page.tsx` | Unique email/public slug, role field, RLS self-access + public profile policy |
| `resumes` | Uploaded resume metadata + parsed/structured text | `/api/upload-resume`, auto-apply structuring path, resume file routes | `/api/upload-resume`, `/api/smart-apply`, `/api/resume-analysis/[id]`, resume selectors in hooks | FK `user_id`, RLS self-manage, indexed by `user_id`, includes `structured_json` |
| `resume_analysis` | ATS analyses and optional share token | `/api/analyze-resume`, `/api/recruiter/resumes/[resumeId]/analyze`, `/api/share` | `/api/dashboard`, `/api/history`, `/api/resume-analysis/[id]`, share/public profile flows | Score bounds, ownership via joined resume policy, share token uniqueness |
| `improved_resumes` | AI-improved resume versions | `/api/improve-resume`, improved resume CRUD endpoints | history/dashboard/job-board resume source hooks | RLS self-manage, indexed by user/resume/time |
| `job_matches` | Resume-vs-JD match snapshots | `/api/job-match` | `/api/dashboard`, `/api/history`, `/api/job-matches/[id]` | Score bounds, RLS self-manage, score/time indexes |
| `applications` | Candidate application tracker | `/api/applications*`, `/api/auto-apply/[id]/confirm`, `lib/smartApplyEngine.ts` | `/api/dashboard`, `/api/resume-performance`, `use-applications` | Status enum/check constraints, update trigger, user/status indexes |
| `job_postings` | Recruiter jobs + job-board source | `/api/recruiter/jobs*`, optimization/shortlist updates | `/api/jobs`, `/api/jobs/[id]`, recruiter dashboards/pages | Status/work type checks, recruiter-manage + public active-read policy |
| `job_applications` | Candidate applications to recruiter jobs | `/api/jobs/[id]/apply`, recruiter stage/screen/interview routes | recruiter applications/candidate analytics/skill-gap flows | Unique `(job_id,candidate_id)`, stage/rating constraints, recruiter/candidate RLS |
| `messages` | Recruiter-candidate messaging | `/api/messages`, `/api/messages/mark-read` | `/api/messages`, `/api/messages/thread`, unread summary hooks | Sender/receiver RLS, read updates policy, realtime publication/indexes |
| `notifications` | In-app notifications | `/api/notifications` updates; `lib/notifications.ts` inserts | `use-notifications`, bell/topbar components | Type enum, unread index, self-view/update RLS |
| `auto_apply_runs` | Auto/smart apply run state machine | `/api/auto-apply*`, `lib/autoApplyEngine.ts`, `lib/smartApplyEngine.ts` | `/api/auto-apply`, run detail polling hooks, reporting libs | Status enum, self RLS, `updated_at` lifecycle updates |
| `smart_apply_rules` | Recurring smart apply config per resume | `/api/smart-apply` | smart-apply UI (`use-smart-apply`) | Unique `(user_id,resume_id)`, self-only RLS |
| `usage_logs` | Feature quota + burst limit ledger | `lib/usage.ts`, `lib/rateLimit.ts`, streak rewards quota adjustments | `/api/usage`, all gated route checks | Feature constraints, monthly count scans, rate-limit indexes |
| `companies` | Recruiter company profile + branding | `/api/recruiter/company*`, logo routes | recruiter company/settings/topbar contexts | RLS recruiter-manage + public read, size checks |
| `saved_searches` | Recruiter alert/search presets | `/api/recruiter/alerts*` | recruiter alerts page/hooks | recruiter-only RLS, JSONB filters |
| `message_templates` | Recruiter outreach templates | `/api/recruiter/templates*` | recruiter templates page/hooks | template-type checks, recruiter-only RLS |
| `candidate_skills` | Normalized candidate skill graph | sync libs (`candidateGraph`) from resume structuring/profile changes | recruiter shortlist/search/intelligence, skill-demand/coaching | Unique `(user_id, skill_normalized)`, supply indexes, read policies |
| `skill_demand` | Aggregated demand/supply trends | `lib/skillDemand.ts` refresh job | `/api/skill-demand`, public skills pages | Unique `(normalized_skill, month)`, month/title indexes |
| `salary_data` | Salary intelligence dataset | `lib/salaryIntelligence.ts` ingestion paths | `/api/salary-intelligence`, salary pages | normalized title/location indexing |
| `user_streaks` | Streak progression and multiplier state | `lib/streakSystem.ts`, trigger-driven updates | `/api/streak`, `/api/streak-rewards`, dashboard streak widgets | unique user row, leaderboard index |
| `opportunity_alerts` | Personalized urgency alerts | `lib/opportunityAlerts.ts`, scan trigger | `/api/opportunity-alerts*`, dashboard alert widget | alert/urgency enums, active-alert indexes |
| `activity_feed` | Personal/public activity timeline | `lib/activityFeed.ts`, rewards/boost/activity side effects | `/api/activity-feed`, activity page | activity type checks, public feed index |
| `recruiter_pushes` | Recruiter push nudges to candidates | `/api/recruiter/push`, `lib/recruiterAutoPush.ts` | opportunity scan libs, candidate engagement UX | daily-cap logic + candidate/recruiter indexes |

---

## 21. Cross-Reference Index (Endpoint -> Hook -> UI Entry)

### Resume Flow

| Endpoint | Primary hook(s) | UI entry files |
|---|---|---|
| `/api/upload-resume` | `useUploadResume`, `useResumes`, `useJobBoardResumes` | `components/resume/ResumeUpload.tsx`, `components/auto-apply/AutoApplyForm.tsx`, `app/(dashboard)/resume-analyzer/page.tsx` |
| `/api/analyze-resume` | `useAnalyzeResume` | `app/(dashboard)/resume-analyzer/page.tsx`, `app/(dashboard)/onboarding/page.tsx` |
| `/api/improve-resume` | `useImproveResume` | `app/(dashboard)/resume-analyzer/page.tsx`, `components/tailor/TailorResumeForm.tsx` |
| `/api/resume-analysis/[id]` | `useResumeAnalysisById` | `app/(dashboard)/resume-analyzer/page.tsx` |
| `/api/improved-resumes` | `useJobBoardImprovedResumes` | `app/(dashboard)/job-board/page.tsx` |
| `/api/improved-resumes/[id]` | `useImprovedResumeById` | `app/(dashboard)/resume-analyzer/page.tsx` |
| `/api/import-linkedin` | `useImportLinkedIn` | `components/linkedin/LinkedInImportForm.tsx`, `app/(dashboard)/import-linkedin/page.tsx` |

### Job Tools

| Endpoint | Primary hook(s) | UI entry files |
|---|---|---|
| `/api/auto-jobs` | `useAutoJobsSearch` | `components/job-finder/JobFinderForm.tsx`, `app/(dashboard)/job-finder/page.tsx` |
| `/api/jobs` | `useJobs` | `app/(dashboard)/job-board/page.tsx` |
| `/api/jobs/applied` | `useAppliedJobIds` | `app/(dashboard)/job-board/page.tsx` |
| `/api/jobs/[id]/apply` | `useApplyToJob` | `app/(dashboard)/job-board/page.tsx` |
| `/api/job-match` | `useJobMatch` | `components/job/JobMatchForm.tsx`, `app/(dashboard)/job-match/page.tsx` |
| `/api/generate-cover-letter` | `useGenerateCoverLetter` | `components/cover-letter/CoverLetterForm.tsx`, `app/(dashboard)/cover-letter/page.tsx`, `app/(dashboard)/job-board/page.tsx` |
| `/api/interview-prep` | `useInterviewPrep` | `app/(dashboard)/interview-prep/page.tsx` |
| `/api/salary-intelligence` | `useSalaryIntelligenceSearch` | `app/(dashboard)/salary-insights/page.tsx` |
| `/api/career-coach` | `useCareerCoach` | `app/(dashboard)/career-coach/page.tsx` |

### Auto/Smart Apply

| Endpoint | Primary hook(s) | UI entry files |
|---|---|---|
| `/api/auto-apply` | `usePastRuns`, `useStartAutoApply` | `app/(dashboard)/auto-apply/page.tsx`, `components/auto-apply/AutoApplyForm.tsx` |
| `/api/auto-apply/[id]` | `useAutoApplyRun`, `usePatchAutoApplySelections` | `app/(dashboard)/auto-apply/page.tsx`, `components/auto-apply/AutoApplyResults.tsx` |
| `/api/auto-apply/[id]/confirm` | `useConfirmAutoApply` | `components/auto-apply/AutoApplyResults.tsx` |
| `/api/smart-apply` | `useSmartApplyRules`, `useSaveSmartApplyRule`, `useToggleSmartApplyRule` | `app/(dashboard)/smart-apply/page.tsx` |
| `/api/usage` | `useUsage` | `app/(dashboard)/smart-apply/page.tsx`, `components/layout/Topbar.tsx` |

### Recruiter

| Endpoint | Primary hook(s) | UI entry files |
|---|---|---|
| `/api/recruiter/jobs` | `useRecruiterJobs`, `useCreateRecruiterJob` | `app/(recruiter)/recruiter/jobs/page.tsx`, `app/(recruiter)/recruiter/jobs/new/page.tsx`, `app/(recruiter)/recruiter/page.tsx` |
| `/api/recruiter/jobs/[id]` | `useRecruiterJob`, `usePatchRecruiterJob`, `useDeleteJob`, `useToggleJobStatus` | `app/(recruiter)/recruiter/jobs/[id]/page.tsx`, `app/(recruiter)/recruiter/jobs/page.tsx` |
| `/api/recruiter/jobs/generate-description` | `useGenerateJobDescription` | `app/(recruiter)/recruiter/jobs/new/page.tsx`, `app/(recruiter)/recruiter/jobs/[id]/page.tsx` |
| `/api/recruiter/jobs/[id]/optimize` | `useOptimizeRecruiterJob` | `app/(recruiter)/recruiter/jobs/[id]/optimize/page.tsx` |
| `/api/recruiter/jobs/[id]/auto-shortlist` | `useAutoShortlistRecruiterJob` | `app/(recruiter)/recruiter/jobs/[id]/auto-shortlist/page.tsx` |
| `/api/recruiter/candidates` | `useRecruiterCandidatesSearch` | `app/(recruiter)/recruiter/candidates/page.tsx` |
| `/api/recruiter/candidates/[id]` | `useRecruiterCandidateDetail` | `app/(recruiter)/recruiter/candidates/[id]/page.tsx` |
| `/api/recruiter/resumes/[resumeId]/download` | `useRecruiterResumeSignedUrl` | `app/(recruiter)/recruiter/candidates/[id]/page.tsx` |
| `/api/recruiter/resumes/[resumeId]/analyze` | `useRecruiterResumeAnalyze` | `app/(recruiter)/recruiter/candidates/[id]/page.tsx` |
| `/api/recruiter/applications` | `useRecruiterApplications` | `app/(recruiter)/recruiter/applications/page.tsx`, `app/(recruiter)/recruiter/page.tsx` |
| `/api/recruiter/applications/[id]` | `useUpdateApplicationStage` | `app/(recruiter)/recruiter/applications/page.tsx` |
| `/api/recruiter/applications/[id]/screen` | `useScreenApplication` | `app/(recruiter)/recruiter/applications/page.tsx` |
| `/api/recruiter/alerts*` | `useRecruiterAlerts`, `useCreateAlert`, `useDeleteAlert` | `app/(recruiter)/recruiter/alerts/page.tsx` |
| `/api/recruiter/templates*` | `useRecruiterTemplates`, `useSaveTemplate`, `useDeleteTemplate` | `app/(recruiter)/recruiter/templates/page.tsx` |
| `/api/recruiter/company*` | `useRecruiterCompany`, `useSaveCompany`, `useUploadCompanyLogo`, `useRemoveCompanyLogo` | `app/(recruiter)/recruiter/company/page.tsx`, recruiter topbar/settings |
| `/api/recruiter/intelligence` | `useRecruiterIntelligence` | `app/(recruiter)/recruiter/analytics/page.tsx` |
| `/api/recruiter/top-candidates` | `useRecruiterTopCandidates` | `app/(recruiter)/recruiter/top-candidates/page.tsx` |
| `/api/recruiter/instant-shortlist` | `useInstantShortlist` | `app/(recruiter)/recruiter/instant-shortlist/page.tsx` |
| `/api/recruiter/push` | `usePushCandidate` | `app/(recruiter)/recruiter/instant-shortlist/page.tsx` |
| `/api/recruiter/skill-gap` | `useRecruiterSkillGap` | `app/(recruiter)/recruiter/skill-gap/page.tsx` |
| `/api/recruiter/salary-estimate` | `useRecruiterSalaryEstimate` | `app/(recruiter)/recruiter/salary-estimator/page.tsx` |

### Messaging

| Endpoint | Primary hook(s) | UI entry files |
|---|---|---|
| `/api/messages` | `useMessages`, `useSendMessage` | `components/messages/MessagesInbox.tsx`, `app/(dashboard)/messages/page.tsx`, `app/(recruiter)/recruiter/messages/page.tsx` |
| `/api/messages/thread` | `useThreadMessages` | `components/messages/MessagesInbox.tsx` |
| `/api/messages/unread-summary` | `useMessageUnreadSummary`, `useMessageUnreadState` | topbars/sidebars and recruiter home page |
| `/api/messages/mark-read` | `useMessagingReadSync` (+ direct API call in inbox) | `components/messages/MessagesInbox.tsx` |
| `/api/messages/recipient-search` | direct helper in picker | `components/messages/RecipientPicker.tsx`, inbox compose UI |
| `/api/messages/attachment` | direct helper in inbox | `components/messages/MessagesInbox.tsx` |

### Profile/Settings and User State

| Endpoint | Primary hook(s) | UI entry files |
|---|---|---|
| `/api/user` | `useUser`, `useUpdateUser` | seeker/recruiter settings pages, topbars |
| `/api/user/avatar` | `useUploadAvatar`, `useRemoveAvatar` | recruiter settings (and shared avatar flows) |
| `/api/user/role` | `useSwitchRole` | role selector page and recruiter settings |
| `/api/user/delete-account` | `useDeleteAccount` | `app/(dashboard)/settings/SettingsForm.tsx` |
| `/api/notifications` | `useNotifications`, `useMarkRead`, `useMarkAllRead` | `components/layout/NotificationBell.tsx` |

### Dashboard, Analytics, Gamification

| Endpoint | Primary hook(s) | UI entry files |
|---|---|---|
| `/api/dashboard` | `useDashboardStats` | `app/(dashboard)/dashboard/page.tsx` |
| `/api/history` | `useHistory` | `app/(dashboard)/history/page.tsx` |
| `/api/insights` | `useInsights` | `app/(dashboard)/analytics/page.tsx` |
| `/api/skill-demand` | `useSkillDemand` | `app/(dashboard)/skill-demand/page.tsx` |
| `/api/activity-feed` | `useActivityFeed` | `app/(dashboard)/activity/page.tsx` |
| `/api/platform-stats` | `usePlatformStats` | `app/(dashboard)/activity/page.tsx` |
| `/api/streak` | `useStreak`, `useRecordStreakLogin` | streak widget/dashboard |
| `/api/streak-rewards` | `useStreakRewards`, `useClaimReward` | `app/(dashboard)/streak-rewards/page.tsx` |
| `/api/daily-actions` | `useDailyActions`, `useCompleteDailyAction` | `components/dashboard/DailyActions.tsx` |
| `/api/opportunity-alerts*` | `useOpportunityAlerts`, `useDismissAlert`, `useTriggerAlertScan` | `components/dashboard/OpportunityAlerts.tsx` |

### Public Landing Funnel

| Endpoint | Primary hook(s) | UI entry files |
|---|---|---|
| `/api/public/extract-resume` | `usePublicExtractResume` | `components/landing/HeroResumeCTA.tsx`, `app/page.tsx` |
| `/api/public/fresher-resume` | `usePublicFresherResume` | `components/landing/CreateResumeFresherFlow.tsx`, `app/create-resume/page.tsx`, landing entry |

---

## 22. AI Prompt System Implementation Update (Phase 1-5)

### 22.1 New core `lib/` infrastructure

- `lib/aiPromptFactory.ts`
  - Shared prompt builder with system/task/schema/constraint structure.
- `lib/aiJson.ts`
  - Fence-tolerant JSON extraction for robust parsing.
- `lib/aiInputSanitizer.ts`
  - Input normalization + budgeted truncation; resume section prioritization.
- `lib/aiRollout.ts`
  - Feature flags/canary/telemetry gates for prompt-system rollout.
- `lib/ai.ts` (`cachedAiGenerateJsonWithGuard`)
  - Guarded JSON generation with bounded retries, normalization hooks, rollout control, and optional telemetry logs.

### 22.2 Endpoint behavior changes

- `POST /api/improve-resume`
  - upgraded to 2-step AI flow:
    1. compact profile extraction
    2. final rewrite using compact profile + constrained fallback resume
- `lib/resumeStructurer.ts`
  - upgraded to 2-step structuring:
    1. structure seed extraction
    2. full structured JSON generation from seed + fallback resume
- `POST /api/job-match`
  - guarded JSON path + sanitizer + confidence normalization.
- ATS analysis helper (`lib/ats-resume-analysis.ts`)
  - guarded JSON path + sanitizer + confidence normalization.
- Recruiter AI endpoints:
  - `POST /api/recruiter/applications/[id]/screen`
  - `POST /api/recruiter/jobs/[id]/auto-shortlist`
  - `POST /api/recruiter/skill-gap`
  - now use guarded JSON generation, strict output normalization, and confidence-aware responses.

### 22.3 Schema and control updates

- Added `confidence` field to primary scoring responses:
  - ATS result
  - Job match result
  - Recruiter AI screening and skill-gap outputs (plus shortlist candidate confidence)
- Enforced strict recommendation enum safety in recruiter screening:
  - `strong_yes | yes | maybe | no`
- Rollout control environment flags:
  - `AI_PROMPT_SYSTEM_ENABLED`
  - `AI_PROMPT_CANARY_PERCENT`
  - `AI_PROMPT_TELEMETRY_ENABLED`

### 22.4 Architectural impact

- Reduced parse-fragility risk via centralized guarded JSON handling.
- Lowered token volatility through input sanitization and heavy-flow compaction.
- Improved operational safety via canary release controls and telemetry-backed rollout.

