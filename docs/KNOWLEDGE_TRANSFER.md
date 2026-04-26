# AI Job Assistant – Knowledge Transfer Document

> 2026-04-23 update: Added prompt reliability infrastructure (`lib/aiPromptFactory.ts`, `lib/aiJson.ts`, `cachedAiGenerateJsonWithGuard` in `lib/ai.ts`) and migrated ATS analysis + `POST /api/job-match` + `POST /api/improve-resume` to guarded JSON generation. Added input-control layer via `lib/aiInputSanitizer.ts` (normalization + section-prioritized resume sanitization + feature budgets), now applied in ATS analysis, job match, improve-resume, and resume structuring. Added Phase 3 heavy-flow pipeline: 2-step compact extraction -> final generation in `POST /api/improve-resume` and `lib/resumeStructurer.ts`, with dedicated cache features for compact seed/profile steps. Added Phase 4 enum/confidence hardening: ATS + job-match + recruiter AI screening/shortlist/skill-gap now enforce strict enums, bounded scores, and normalized `confidence` outputs via guarded JSON. Added Phase 5 rollout controls: `lib/aiRollout.ts` (`AI_PROMPT_SYSTEM_ENABLED`, `AI_PROMPT_CANARY_PERCENT`, `AI_PROMPT_TELEMETRY_ENABLED`) and telemetry tags/rollout keys wired into guarded AI endpoints for canary and observability.
> 2026-04-23 update (AI usage tracking): Added migration `20260423150000_ai_usage_credit_tracking.sql` (`ai_usage` table + `users.total_credits/used_credits`), added `lib/aiUsage.ts` + `lib/aiUsageQueries.ts`, extended `lib/ai.ts` to log per-call token/credit/cost usage and optional credit enforcement (`AI_USAGE_TRACKING_ENABLED`, `AI_CREDITS_ENFORCEMENT_ENABLED`), added usage APIs (`/api/usage/summary`, `/api/usage/history`, `/api/usage/feature-breakdown`), and added dashboard page `/(dashboard)/usage` with React Query hook `hooks/queries/use-ai-usage.ts`.
> 2026-04-23 update (credit exhaustion handling): Added `lib/aiCreditError.ts` and standardized `CREDITS_EXHAUSTED` API responses (HTTP 402 + upgrade message) across core AI endpoints (ATS, improve-resume, job-match, cover-letter, interview-prep, LinkedIn import, job finder extraction, recruiter screening/shortlist/skill-gap/salary/job generation/optimize). `autoApplyEngine` now marks runs failed with explicit credit exhaustion message instead of silent AI fallback when credits are exhausted.
> 2026-04-23 update (UI error normalization): Extended `lib/api-error.ts` to parse backend `message` fields and normalize `CREDITS_EXHAUSTED` into a user-facing upgrade message in `formatApiError`/`formatApiFetchThrownError`, so recruiter/jobseeker pages using `apiFetch` no longer show raw error codes.
> 2026-04-23 update (upgrade CTA on credit exhaustion): Added client helper `lib/client-ai-error.ts` (`isAiCreditsExhaustedMessage`) and reusable UI block `components/ui/AICreditExhaustedAlert.tsx`. Wired recruiter AI pages (`/recruiter/jobs/[id]/auto-shortlist`, `/recruiter/jobs/[id]/optimize`, `/recruiter/skill-gap`, `/recruiter/salary-estimator`, `/recruiter/jobs/new` AI generation path) and jobseeker interview prep page to show an explicit upgrade CTA when credits are exhausted. Also switched `hooks/mutations/use-interview-prep.ts` to `apiFetchJsonWithHumanizer` so API errors are consistently humanized.
> 2026-04-23 update (additional CTA coverage): Extended credit-exhausted upgrade CTA handling to more AI surfaces: jobseeker `/resume-analyzer`, `/salary-insights`, `/smart-apply`, recruiter candidate ATS action at `/recruiter/candidates/[id]`, and recruiter job edit page `/recruiter/jobs/[id]` (AI regenerate path). These now branch on `isAiCreditsExhaustedMessage` and render `AICreditExhaustedAlert` with plan-specific pricing links.
> 2026-04-23 update (structured UI error normalization): Added `toAiUiError` in `lib/client-ai-error.ts` to normalize unknown thrown errors into `{ message, isCreditsExhausted }` using API error JSON parsing + fallback formatting. Updated key AI pages (interview prep, smart apply, resume analyzer, salary insights, recruiter candidate ATS action, recruiter job edit AI regenerate) to rely on this structured error result instead of pure message-regex checks.
> 2026-04-23 update (recruiter parity for structured errors): Migrated remaining recruiter AI pages (`/recruiter/jobs/new`, `/recruiter/jobs/[id]/auto-shortlist`, `/recruiter/jobs/[id]/optimize`, `/recruiter/salary-estimator`, `/recruiter/skill-gap`) from direct `formatApiFetchThrownError` + regex branching to `toAiUiError`, with local `isCreditError` state driving `AICreditExhaustedAlert`.
> 2026-04-23 update (navigation): Added dashboard sidebar navigation entry `AI Usage` -> `/usage` in `components/layout/Sidebar.tsx` under "Track & insights" so users can reach the AI credit usage dashboard without direct URL.
> 2026-04-23 update (AI usage reliability + diagnostics): Updated `lib/aiUsage.ts` to fall back to request-scoped server Supabase client when service-role client is unavailable, so usage logging and credit balance checks can still function in authenticated API flows without `SUPABASE_SERVICE_ROLE_KEY`. Updated `lib/ai.ts` usage tracking calls to log warnings on tracking failures (instead of silent swallow). Updated `POST /api/generate-cover-letter` to return `detail` in 500 responses for faster diagnosis when AI generation fails.
> 2026-04-23 update (usage observability hardening): Added explicit Supabase error handling in `lib/aiUsage.ts` (insert/read/update warnings) and strict query error propagation in `lib/aiUsageQueries.ts` so missing schema/RLS/query issues no longer appear as silent zero metrics. Usage APIs now return 500 with `detail` (`/api/usage/summary`, `/api/usage/history`, `/api/usage/feature-breakdown`) when underlying usage queries fail.
> 2026-04-23 update (DB permissions fix): Added migration `20260423183000_ai_usage_grants.sql` to grant `authenticated` role `SELECT, INSERT` on `public.ai_usage` (with existing RLS policies still enforcing per-user row access) and schema usage grant, resolving `permission denied for table ai_usage` on usage APIs.
> 2026-04-26 update (audit artifacts): Added `docs/FEATURE_WISE_GAPS_SCENARIOS_DEPENDENCIES.md` with feature-by-feature production readiness gaps, scenario coverage (happy/edge/fail/sec/data/ops), and dependency mapping across UI/API/lib/DB/infra.
> 2026-04-26 update (UX reliability Phase 1): Added shared feedback primitives `components/ui/ActionStatusBanner.tsx`, `components/ui/InlineRetryCard.tsx`, `components/ui/ActionReceiptCard.tsx` and normalization helper `lib/ui-feedback.ts`; extended `lib/api-error.ts` + `lib/client-ai-error.ts` to parse/pass `requestId`, `retryable`, and next-step metadata. Updated Resume Analyzer, Cover Letter, Auto Apply, and Smart Apply flows to show explicit progress/receipt/retry UX. Added richer run metadata for auto-apply (`currentStep`, `processedCount`, `failedCount`, `failedItems`) in `GET /api/auto-apply/[id]`; `POST /api/auto-apply/[id]/confirm` now returns failed item details; `GET /api/smart-apply` now includes last execution reason metadata; `POST /api/generate-cover-letter` now returns `ok/message/meta.savedId/meta.savedAt/meta.requestId` and structured retryable errors.
> 2026-04-27 update (UX reliability Phase 2 recruiter flows): Added recruiter-side trust UX improvements for job create/edit/optimize and batch screening flows. New reusable `components/recruiter/BatchScreeningReport.tsx` shows itemized success/skipped/failed outcomes with retry affordance. `POST /api/recruiter/jobs/[id]/auto-shortlist` now returns `itemized` per-application statuses/reasons (alongside totals), and `useAutoShortlistRecruiterJob` types were expanded accordingly. Recruiter pages now use shared retry/receipt patterns (`InlineRetryCard`, `ActionReceiptCard`) in `/recruiter/jobs/new`, `/recruiter/jobs/[id]`, `/recruiter/jobs/[id]/optimize`, `/recruiter/jobs/[id]/auto-shortlist`, `/recruiter/skill-gap`, and candidate profile ATS actions (`/recruiter/candidates/[id]`), including before/after context for optimize output and explicit progress/status messaging.
> 2026-04-27 update (UX reliability Phase 3 messaging + usage confidence): Added messaging confidence components `components/messages/MessageDeliveryState.tsx` and `components/messages/RealtimeHealthBadge.tsx`; `MessagesInbox` now surfaces explicit send state (`sending/sent/read/failed`), realtime connectivity status, and non-silent inline retry cards for send/upload errors. `POST /api/messages` now returns send metadata (`ok`, `message`, `messageId`, `sentAt`, `notificationQueued`, `meta.requestId`) and structured retryable failures. Added usage confidence component `components/usage/UsageHealthChip.tsx`; usage dashboard now shows health chip, generated/refresh timestamps, and actionable retry diagnostics on API failures. Usage APIs (`/api/usage/summary`, `/api/usage/history`, `/api/usage/feature-breakdown`) now include `meta.generatedAt` + `meta.requestId` on success and structured retry metadata on failures. Cross-cutting response contract hardening applied to key AI mutation endpoints (`/api/analyze-resume`, `/api/improve-resume`, `/api/job-match`, `/api/auto-jobs`, `/api/interview-prep`) with added `ok/message/meta.nextStep/meta.requestId` on success and `retryable/nextAction/requestId` on error responses.
> 2026-04-27 update (Recruiter AI API contract parity): Applied the same structured response contract to remaining recruiter AI endpoints: `POST /api/recruiter/jobs/generate-description`, `POST /api/recruiter/jobs/[id]/optimize`, `POST /api/recruiter/skill-gap`, `POST /api/recruiter/salary-estimate`, `POST /api/recruiter/applications/[id]/screen`, `POST /api/recruiter/resumes/[resumeId]/analyze`, and `POST /api/recruiter/jobs/[id]/auto-shortlist`. These now include `ok/message/meta.requestId/meta.nextStep` on success and `requestId/retryable/nextAction` on errors (including `CREDITS_EXHAUSTED`), enabling consistent frontend recovery UX and traceability across recruiter AI surfaces.
> 2026-04-27 update (automation testing system): Added a complete QA automation foundation with deterministic fixtures (`fixtures/users.json`, `fixtures/resumes/sample-resume.txt`, `fixtures/jobs/sample-job-posting.json`), critical Playwright E2E specs (`e2e/resume-flow.spec.ts`, `e2e/auto-apply.spec.ts`, `e2e/recruiter-flow.spec.ts`), API contract/data-integrity suites (`api-tests/contracts.api.spec.ts`, `api-tests/data-integrity.api.spec.ts`), helper modules for fixture loading and network mocking (`e2e/helpers/*`, `api-tests/helpers/auth-context.ts`), and seeded test-data SQL generator (`scripts/test/seed-fixtures.mjs`). Added npm scripts `test:e2e:critical`, `test:api`, and `test:all:qa`; documented execution and mock strategy in `docs/AUTOMATED_TESTING_STRATEGY.md`.
> 2026-04-27 update (usage credit balance query hardening): Replaced `.single()` credit lookups with `.limit(1)` row selection in `lib/aiUsageQueries.ts` and `lib/aiUsage.ts` to avoid PostgREST "Cannot coerce the result to a single JSON object" noise on sparse/non-seeded environments. Usage summary and credit-balance helpers now treat missing user-credit row as safe defaults instead of emitting false-negative query errors.
> 2026-04-27 update (messages hydration fix): `MessagesInbox` now initializes realtime connectivity state as `null` and resolves `navigator.onLine` only after mount. `RealtimeHealthBadge` accepts `connected: boolean | null` and renders neutral `Checking…` state pre-hydration, preventing SSR/client text mismatch (`Disconnected` vs `Connected`) on `/messages`.
> 2026-04-27 update (stability follow-ups): `createNotificationForUser` in `lib/notifications.ts` now returns a boolean delivery result, and `POST /api/messages` returns real `notificationQueued` based on insert outcome (instead of hardcoded true). `app/api/auto-apply/[id]` (`GET`/`PATCH`) now follows structured error metadata contract (`requestId`, `retryable`, `nextAction`) and surfaces update-write failure in PATCH. Added migration `20260427020500_messages_recipient_search_rpc_grant_fix.sql` to re-assert EXECUTE grants for `search_message_recipients(text, int)` to prevent recipient-search 42501 permission regressions.
> 2026-04-27 update (recruiter usage route parity): Added shared UI component `components/usage/AiUsageDashboard.tsx` and mounted it at both job seeker `/usage` and recruiter `/recruiter/usage`. Updated `components/layout/RecruiterSidebar.tsx` to link `AI Usage` to `/recruiter/usage`, preventing layout switch from recruiter shell to job-seeker shell.

**Purpose:** Single source of truth for how the app works. Update this doc whenever you change routes, APIs, components, lib, or database.

**Last updated:** 2026-04-23 (**Docs:** **`docs/CODEBASE_AI_ARCH_COST_REPORT.md`** v2 — corrected token/cost model, hidden auto-apply structurer + deep-match math, split input/output pricing; companion **`docs/CODEBASE_AI_ARCH_COST_REPORT_INVESTOR.md`** updated; **`docs/CODEBASE_AI_ARCH_COST_REPORT_APPENDIX.md`** (API ↔ LLM matrix).) **2026-04-09 — Read receipts:** **`hooks/use-messaging-read-sync.ts`** — broadcast after **`POST /api/messages/mark-read`** so the peer invalidates **`useThreadMessages`** / inbox and picks up **`read_at`**; migration **`20260409120000_messages_replica_identity_full.sql`** sets **`REPLICA IDENTITY FULL`** on **`public.messages`** for reliable Realtime **`UPDATE`**. **Earlier 2026-04-08 — Messaging gaps:** **`Topbar`** Messages icon links to **`/recruiter/messages`** when **`pathname`** starts with **`/recruiter`**, else **`/messages`**; **`/recruiter`** home unread stat uses **`useMessageUnreadSummary`** (sum of **`GET /api/messages/unread-summary`** counts, not inbox page size). Migration **`20260408120000_backfill_messages_read_at.sql`** sets **`read_at = created_at`** where **`is_read`** and **`read_at`** was null (approximation for legacy rows). **Earlier 2026-04-02 — Messaging:** **`messages.read_at`** on mark-read; optional **`attachment_path` / `attachment_name` / `attachment_mime`** + Storage bucket **`message-attachments`**; **`POST /api/messages/attachment`** (multipart **`file`**); **`GET /api/messages`** and **`GET /api/messages/thread`** add signed **`attachment_url`** per row; **`search_message_recipients`** ranks exact email → prefix → name prefix → recent thread activity (migration **`20260407120000_messages_read_at_attachments_search_rank.sql`**). **`MessagesInbox`:** attachments (compose + reply), **Sent/Read** on own bubbles, **`useMessagingTyping`** (Realtime broadcast). **Earlier 2026-04-06 — Messaging UX:** **`GET /api/messages/thread`** + **`GET /api/messages/unread-summary`**; **`MessagesInbox`** loads the open thread via **`useThreadMessages`** (not inbox slice only); per-thread unread badges; **`useSendMessage`** optimistic merge into thread cache; job seeker **`Topbar`**: **Messages** icon + **`NotificationBell`**; bell **UPDATE** realtime + **`mark_read`** optimistic cache; message notifications navigate to **`?peer=sender_id`**. **Product consistency:** **`Topbar`** derives plan from **`useUser`** (no layout hardcode **`planType="free"`**); usage chips use **`FREE_PLAN_LIMITS`** fallbacks aligned with **`/api/usage`**; **Upgrade** only when user is loaded and **`plan_type === free`**. Landing **Free** tier bullets use **`FREE_PLAN_LIMITS`**. **`createNotificationForUser`** logs **`notification_delivery_skipped`** / **`notification_insert_failed`** when service role missing or insert fails. **`GET /api/recruiter/candidates`** includes **`search_quality`** describing scan/filter model.) **Earlier 2026-04-02 — P0–P5 hardening:** **`GET /api/dashboard`** joins **`resume_analysis`** to **`resumes!inner(user_id)`** and filters **`resumes.user_id`** to the current user so analyses stay owner-scoped. **`lib/usage`:** **`getUsageSummary`** uses per-feature monthly **`COUNT`** on **`usage_logs`** (exact totals); Pro **`checkAndLogUsage`** returns **`used`** from **`getUsageCount`**. **`GET /api/messages`:** query **`limit`** (default 100, max 200), **`before`** (cursor); JSON **`has_more`**, **`next_before`**, **`partial`**; **`useMessages`** (**`useInfiniteQuery`**) + **Load older** in **`MessagesInbox`**. **`GET /api/recruiter/candidates`:** **`limits`** object + **`resume_preview`** capped at **`resume_preview_chars`**. Landing + **`ProductNarrativeBanner`** copy softened (no hard multipliers). **Earlier 2026-04-05 — Message inbox:** **POST /api/messages** calls **`createNotificationForUser`** for **`receiver_id`** (needs **`SUPABASE_SERVICE_ROLE_KEY`**). **PATCH /api/user** recalculates strength only when **`name`** is updated. **POST /api/generate-cover-letter** picks **`improvedResumeId` > `resumeId` > `resumeText`** if several are sent. **NotificationBell** realtime subscription filters by **`user_id`**. **Later same day:** **`GET /api/recruiter/company`** returns an array — **`useRecruiterCompany`** uses the first row for the company form. **`useSaveCompany`** invalidates **`["user"]`** + **`recruiterKeys.user()`** so **`recruiter_onboarding_complete`** and the sticky banner update. **`POST`/`DELETE /api/recruiter/company/[id]/logo`** → bucket **`company-logos`**; **`lib/image-upload-validate.ts`** shared with avatars. Recruiter **`/recruiter/settings`** profile photo; **`RecruiterTopbar`** + **`Topbar`** show **`UserAvatar`**. **Earlier 2026-04-05:** **Profile:** `GET /api/user` includes `headline`, `bio`, `avatar_url`, `profile_strength`; **`POST`/`DELETE /api/user/avatar`** uploads to Storage bucket **`avatars`** (2MB, JPEG/PNG/WebP) and recomputes strength via **`lib/recalculate-profile-strength.ts`**. **`GET /api/messages`** returns `{ messages, peer_profiles }` using RPC **`messaging_peer_profiles`**. **`ProfileCompletionBanner`** under top bars; **`UserAvatar`** in **`MessagesInbox`** + settings. **PATCH /api/profile** now ends with **`recalculateProfileStrengthForUser`** so strength stays consistent with avatar/skills/ATS.) **Earlier 2026-04-02:** (**Messaging:** canonical **`GET`/`POST /api/messages`**, **`POST /api/messages/mark-read`**, job seeker **`/messages`**, shared **`MessagesInbox`**; **`/api/recruiter/messages`** re-exports. **Query / lib:** `sharedQueryKeys.resumes` in **`hooks/queries/shared-query-keys.ts`** (job-board + smart-apply); **`use-jobseeker-persisted.ts`** — by-id hooks for resume analysis, improved resume, cover letter, job match; **`use-recruiter-intelligence`** → GET **`/api/recruiter/intelligence`** (recruiter analytics UI); **`use-hiring-prediction`** → POST **`/api/hiring-prediction`**; **`use-recruiter.ts`** re-exports **`recruiter-keys`** / **`recruiter-queries`** / **`recruiter-mutations`**; **`apiFetchMultipartJson`** in **`api-fetcher`** for **`usePublicExtractResume`**. **Client API layer:** **`lib/api-fetcher.ts`** — **`apiFetchJsonWithHumanizer`** / **`apiFetchFormJsonWithHumanizer`** dedupe error parsing + friendly messages for resume/cover/upload mutations; **`apiFetchBlob`** for binary (e.g. DOCX). **`use-user.ts`:** **`useDeleteAccount`**. **`use-applications.ts`:** **`useSaveApplication`** (create/update). Mutations: **`use-interview-prep`**, **`use-dev-plan`**, **`use-feedback`**, **`use-public-landing`** (`usePublicExtractResume`, `usePublicFresherResume`). **`/select-role`** uses **`useSwitchRole`**; **`login`** prefetches **`userKeys.me()`** via **`apiFetch`** after password sign-in; settings use **`useUpdateUser`** / **`useDeleteAccount`**; landing flows use public mutations; onboarding uses **`useAnalyzeResume`**. **TanStack (earlier):** **`hooks/mutations/use-cover-letter-crud.ts`** — **`useCoverLetterContent`**, **`usePatchCoverLetter`**, **`useDeleteCoverLetter`** (`GET`/`PATCH`/`DELETE /api/cover-letters/[id]`, invalidates **`dashboardKeys.history`**); **`use-salary-intelligence.ts`** — **`useSalaryIntelligenceSearch`** (`GET /api/salary-intelligence`) for **`/salary-insights`**. **`use-recruiter.ts`:** **`useRecruiterSkillGap`**, **`useRecruiterSalaryEstimate`** for recruiter skill-gap and salary-estimator pages. **TanStack (earlier):** `use-auto-apply.ts` includes **`usePatchAutoApplySelections`** (PATCH `/api/auto-apply/[id]`) and **`useConfirmAutoApply`** (POST `/api/auto-apply/[id]/confirm`, invalidates applications); **`AutoApplyResults`** uses them instead of raw `fetch`. **`use-recruiter.ts`** adds job helpers (**`useGenerateJobDescription`**, **`useCreateRecruiterJob`**, **`usePatchRecruiterJob`**, **`useOptimizeRecruiterJob`**, **`useAutoShortlistRecruiterJob`**) and candidate helpers (**`useRecruiterCandidatesSearch`**, **`useRecruiterCandidateDetail`**, **`useRecruiterResumeSignedUrl`**, **`useRecruiterResumeAnalyze`**) for recruiter job and candidate pages. **`lib/api-error.ts`:** **`formatApiFetchThrownError`** parses JSON bodies from `apiFetch` errors. **`hooks/mutations/index.ts`** re-exports shared mutation hooks. **Resume client flows:** `hooks/mutations/use-upload-resume`, `use-analyze-resume`, `use-improve-resume`, `use-import-linkedin`, `use-auto-jobs`, `use-job-match` — shared by **`ResumeUpload`**, **`/resume-analyzer`**, **`TailorResumeForm`**, **`JobFinderForm`**, **`LinkedInImportForm`**, **`JobMatchForm`**; `humanizeUploadResumeError` in **`lib/friendlyApiError.ts`**. **Cover letter:** `lib/resume-for-user.ts`, `lib/job-posting-text.ts`, `lib/api-error.ts`; **`hooks/mutations/use-generate-cover-letter.ts`** powers **`CoverLetterForm`** and Job Board **Generate with AI**; **POST /api/generate-cover-letter** accepts optional **`resumeId`** (loads `parsed_text` server-side). **POST /api/recruiter/jobs/generate-description** returns JSON `description`, `requirements`, `skills_required` via AI JSON mode; recruiter New/Edit job **AI Regenerate** applies all three fields. Recruiter candidate profile: **Preview** (signed URL in iframe for PDFs), **Run ATS analysis** → **POST /api/recruiter/resumes/[resumeId]/analyze** (recruiter `resume_analysis` usage + `lib/ats-resume-analysis.ts`); apply migration **`20260402170000_recruiter_insert_resume_analysis.sql`** so RLS allows recruiter inserts. Job seeker **POST /api/analyze-resume** uses the same ATS helper. **GET /api/recruiter/candidates/[id]** returns `detail` on Supabase query errors to debug embed/FK issues. Recruiter: `/recruiter/candidates/[id]` + **GET /api/recruiter/resumes/[resumeId]/download**; candidate detail API nests `resume_analysis` under `resumes`. Recruiter candidate search API includes all `job_seeker` rows, not only those with resume text; `has_resume` on each row. Middleware: authenticated users visiting `/`, `/login`, `/signup` redirect to `/dashboard` or `/recruiter` via `lib/auth-landing-path.ts`. `users.last_active_role` synced on `PATCH /api/user/role`; login/callback default `/dashboard` uses `last_active_role` for landing; middleware blocks `/recruiter/*` unless `users.role` is recruiter or E2E mock; job seeker sidebar **Hire talent** CTA when not recruiter-eligible. Role switch: `/select-role` awaits React Query refetch of user + recruiter user queries after `PATCH /api/user/role` before navigating; `useRecruiterUser` uses `refetchOnMount: "always"`; `RecruiterLayout` redirect waits until `!isFetching`. RLS migration for recruiter candidate list (follow-up `20260402150000_fix_users_rls_recursion.sql`: `SECURITY DEFINER` helpers `auth_is_recruiter`, `user_is_job_seeker`, `resume_belongs_to_job_seeker` avoid infinite recursion from subqueries on `users`): recruiters can read job_seeker `users` + `resumes` + `user_preferences` + `resume_analysis`. Recruiter candidate search page loads full list on mount up to API limit. Deeper inventory: §4 supplementary lib rows; §6.1 full component catalog by folder. Docs synced to codebase: middleware public API exceptions, unified cron trigger now includes **rate_limit** + **expired ai_cache** cleanup; new routes `GET /api/dashboard`, `GET /api/history`, `GET /api/upload-resume` (list resumes), `GET /api/jobs/applied`, `POST /api/opportunity-alerts/scan`, `POST /api/public/extract-resume`, `POST /api/public/fresher-resume`; dashboard is a **client** page using `useDashboardStats()` → `GET /api/dashboard`; recruiter candidate search uses resume text + preferences filters. GitHub Actions E2E: **cookie mock auth** in `lib/e2e-auth.ts` in **non-production** when mock cookies + `E2E_MOCK_DEFAULT_SECRET` match; `GET`/`PATCH` `/api/user` and `PATCH` `/api/user/role` short-circuit DB for mock IDs. Optional `SUPABASE_SERVICE_ROLE_KEY` for role updates. See `docs/TEST_PLAN_E2E.md`.)

**Product strategy & UX priorities** (positioning, focus, page-level UX backlog): see **`docs/PRODUCT_STRATEGY_UX.md`**. This KT doc describes *implementation*; that doc describes *what to lead with* and *what to simplify*.

---

## 1. Project overview

- **Stack:** Next.js 15 (App Router), React 18, TypeScript, Supabase (Auth + Postgres), Tailwind CSS, TanStack Query (React Query) for client data fetching/mutations. **Lint:** ESLint 9 flat config (`eslint.config.mjs`, extends `next/core-web-vitals`); `next build` runs lint + typecheck. **E2E:** Playwright (`playwright.config.ts`, `e2e/`); route matrix and env vars in `docs/TEST_PLAN_E2E.md`; `npm run test:e2e`. **CI:** `.github/workflows/ci.yml` runs lint, typecheck, build, and E2E (Chromium + cached Playwright browsers).
- **Client data layer:** `lib/query-provider.tsx` wraps the app with `QueryClientProvider`. Hooks in `hooks/queries/` (each pairs with REST routes): `use-dashboard` (`/api/dashboard`, `/api/history`), `use-applications`, `use-auto-apply`, `use-smart-apply`, `use-job-board`, `use-recruiter`, `use-jobseeker-persisted`, `use-recruiter-intelligence`, `use-activity`, `use-notifications`, `use-opportunity-alerts`, `use-streak`, `use-streak-rewards`, `use-daily-actions`, `use-analytics`, `use-career-coach`, `use-resume-performance`, `use-skill-demand`, `use-user` — all use `apiFetch` (`lib/api-fetcher.ts`). **`shared-query-keys.ts`** exports **`sharedQueryKeys.resumes`** so **`use-job-board`** and **`use-smart-apply`** share the same resume-list cache key. **`hooks/mutations/use-hiring-prediction`** wraps **POST /api/hiring-prediction**. **`hooks/mutations/use-generate-cover-letter.ts`** wraps **POST /api/generate-cover-letter** (invalidates dashboard/history, `dispatchUsageUpdated`). Prefer query hooks + shared mutations over ad-hoc `fetch` in new pages.
- **AI:** Gemini (primary) and OpenAI (fallback on 429/quota). See `lib/ai.ts`. Cached wrappers (`cachedAiGenerate`, `cachedAiGenerateContent`) in `lib/ai.ts` check `ai_cache` table before calling AI, reducing costs 30-50%.
- **Main flows:** Resume upload & ATS analysis, **Quick Resume Builder** (`/resume-builder` → draft into Resume Analyzer via `sessionStorage`), resume improve (Pro), job match, cover letter, interview prep, **auto job finder**, **AI auto-apply** (killer feature), **smart auto-apply** (set & forget), **resume tailoring**, **application tracker**, **LinkedIn import**. Usage is tracked per feature; free plan has limits.
- **Improved resume JSON:** `/api/improve-resume` and LinkedIn import responses are passed through **`normalizeImprovedResumeContent`** (`lib/normalizeImprovedResume.ts`); **`ImprovedResumeView`** always renders five sections (Summary, Skills, Experience, Projects, Education) with recovery copy when empty.
- **AI Auto-Apply:** User selects resume → system finds jobs (Adzuna + internal) → pre-filter scores with JS (no AI) → deep AI match top N → **interview probability score** computed per job → user reviews & confirms → applications created. Assisted mode.
- **Smart Auto-Apply:** Pro feature. User sets rules once (min match score, salary range, roles, locations, daily/weekly limits) → system runs daily via cron → auto-applies to qualifying jobs → user notified. `/api/smart-apply/trigger` endpoint for cron.
- **Interview Probability Score:** JS-only (no AI cost). Factors: skill overlap, experience alignment, ATS quality, historical success rate. **Weights are dynamically adjusted** by the Learning Engine based on application outcomes. Returns HIGH/MEDIUM/LOW with reasons and boost tips.
- **Learning Engine:** Tracks applications → interviews → offers/rejections. Extracts insights: best-performing skills, worst-performing roles, conversion rates, response times. Adjusts scoring weights dynamically (e.g., boosts skill weight if user gets interviews with high skill overlap).
- **Career Analytics:** Conversion funnel (Saved→Applied→Interview→Offer), AI recommendations, performance metrics. Available at `/analytics`.
- **Daily AI Reports:** Auto-generated notifications summarizing daily activity (jobs found, applied, interviews, responses). Sent via cron alongside smart-apply trigger.
- **Activity Feed:** Personal and public activity tracking. Logs application submissions, resume improvements, milestones (10/25/50/100/250/500 applications). Public milestones visible in community feed. Social proof.
- **Platform Social Proof:** Aggregated platform stats (total users, applications, interviews, hires, avg match score). Cached in `platform_stats` table, refreshed via cron. Displayed on activity feed page.
- **Role system:** Users have a `role` field (`job_seeker` or `recruiter`) and `last_active_role` (kept in sync on `PATCH /api/user/role`; used with `role` for default post-login landing). Role selection at `/select-role` (shows API errors if PATCH fails). After a successful role PATCH, the page **awaits** `refetchQueries` for `userKeys.me()` and `recruiterKeys.user()` so `/recruiter` does not read stale cached `job_seeker`. Switching via `/api/user/role` PATCH. Route groups: `(dashboard)` for job seekers, `(recruiter)` for recruiters. **Switch UI gating:** `/api/user` returns `recruiter_onboarding_complete` (derived: user has at least one `companies` row). Job seeker sidebar shows **Switch to Recruiter** only when `recruiter_onboarding_complete`; otherwise **Hire talent (recruiter)** → `/select-role?next=/recruiter/company`. Recruiter sidebar shows **Switch to Job Seeker** whenever `role === recruiter` (so recruiter-only users without a company row can still switch back).
- **Recruiter platform:** Job posting CRUD, ATS pipeline (Kanban), candidate search, AI screening, messaging, templates, analytics, salary estimator, skill gap reports, auto-shortlisting, job optimization, saved alerts, pricing plans. **Similar candidates** API uses candidate skill graph (Jaccard similarity). **Hiring Intelligence** dashboard with time-to-hire, conversion rates, pipeline health, stale application alerts, recommendations. **Top Candidates** ranking with boost visibility. **Push notifications** to candidates (job invites, interview requests, profile views, shortlisted).
- **Notifications:** Bell icon with Supabase Realtime subscription for instant updates + toast popup. Fallback polling every 60s. Notifications created on auto-apply completion and smart auto-apply.
- **Growth features:** Shareable ATS score cards (`/share/[token]`). Public profiles (`/u/[slug]`) with skill badges (Expert/Intermediate/Beginner), ATS score, profile strength meter, signup CTA. DOCX watermark.
- **Candidate Graph:** Skills auto-indexed from structured resumes into `candidate_skills` table. `skill_badges` table for public profile display. Enables recruiter "Similar Candidates" feature.
- **Data Moat:** Hiring success prediction model (pure JS, no AI cost), salary intelligence engine (role-based salary ranges, trends, percentiles), skill demand graph (trending/declining/hot skills, demand-supply ratio, salary correlation).
- **Monetization:** Job Seeker: Free ₹0 / Pro ₹299 / Premium ₹499. Recruiter: Starter ₹999 / Pro ₹4,999 / Enterprise ₹14,999. Candidate boost (Pro+: 2x/2.5x visibility in recruiter searches). Profile boost expires after configurable days.
- **Resume Performance Index:** Tracks per-resume-version metrics (applications, interviews, offers). Shows "Best resume for Backend jobs = Version 3" style insights. Score threshold analysis ("Jobs above 80% match = 3x interview rate"). Optimal daily apply count based on historical success.
- **Candidate Competition:** "You're in top 12% for this job", "50 candidates applied, you rank #3". Creates addiction + retention. Hiring benchmark: "Your profile is stronger than 78% of candidates".
- **Recruiter Auto-Push:** AI auto-pushes top matching candidates to recruiters when they post jobs. "8 perfect candidates for your job" — automatic, no recruiter action needed. Runs daily via cron.
- **Shareable Results / Viral Loop:** Share interview probability, hiring benchmark, ATS score via link. OG meta tags for WhatsApp/LinkedIn sharing. Public pages at `/results/[token]` with signup CTA.
- **SEO Distribution:** Public job pages (`/jobs/[slug]`) with JSON-LD structured data. Salary pages (`/salary/[slug]`). Jobs index (`/jobs`). Compete with Naukri.com traffic. Landing page upgraded with features, how-it-works, recruiter section.
- **User Addiction Loop:** Streak system (consecutive activity days with XP multipliers: 3d=1.1x, 7d=1.25x, 14d=1.5x, 30d=2x), daily personalized action items (context-aware, priority-ordered), opportunity alerts (high-match jobs, low-competition, recruiter interest — with urgency levels and expiration). XP points earned on every meaningful action. Streak levels (Newcomer→Getting Started→On a Roll→Dedicated→Unstoppable→Legend→Champion). Streak freeze protection. Daily actions auto-generated based on user context (resume status, pending interviews, recent activity, available matches). Opportunity alerts scanned via cron for all recently active users.
- **Streak Rewards Economy:** Real-value rewards for streaks — 3d: streak freeze token, 7d: 1 free auto-apply credit, 14d: 3-day 2x profile boost, 21d: 2 freeze tokens, 30d: 7-day 2x boost + 3 auto-applies, 50d: 14-day 2.5x boost, 75d: 7-day Pro trial (free users), 100d: permanent 1.5x visibility multiplier. Auto-claimed on milestone hit. Rewards page at `/streak-rewards` shows progress, claimed/unclaimed state.
- **AI Career Coach:** Personal career strategist at `/career-coach`. Diagnoses why user is failing (low ATS, wrong roles, too few applications, generic resumes). Career direction analysis per role (strong/moderate/weak based on interview rate). Skill ROI ranking (highlight existing high-demand skills, learn missing ones, remove dead-end skills). Weekly performance summary with rate change vs previous week. Full score transparency: ATS breakdown (skill match/format/keywords/experience), interview probability weights (dynamically adjusted by learning engine), candidate rank breakdown (profile/ATS/skills/activity/boost). Status levels: thriving/improving/struggling/critical/new.
- **Instant Shortlist (Recruiter):** "Top 10 candidates in 5 seconds". When recruiter posts job or clicks "Find Candidates", system instantly matches candidates by skill graph (candidate_skills table). Composite scoring: skill overlap 50% + profile strength 20% + rank 20% + boost 10%. Shows skill overlap (matched/missing), score breakdown for transparency. One-click "Reach Out" or "Message All" for bulk outreach. `/recruiter/instant-shortlist`.
- **Score Transparency (Trust Layer):** Every score shows "Why this score?" breakdown. Interview probability shows factor weights (skill 35%, experience 25%, resume quality 20%, history 20%) with note that weights are dynamically adjusted. ATS shows category breakdown. Candidate rank shows component scores. Visible on Career Coach page and Instant Shortlist.
- **SEO Data Moat Pages:** Public pages exposing platform data for organic traffic. `/skills` — "Top Skills to Get Hired in 2026" (interview-guarantee skills by demand/supply ratio, highest paying, trending, most in-demand). `/salary` — "Highest Paying Tech Roles 2026" (aggregated salary table with ranges, city links). Both pages have SEO metadata, OG tags, signup CTAs with "Get 3x More Interviews" messaging.
- **Core Hook Refocus:** Landing page rebuilt around single viral hook: "Get 3x More Interviews Using AI". Simplified 3-step process. Social proof metrics (3.2x more interviews, 89% resume pass rate, 5 sec shortlist, ₹0 to start). Interactive score preview card showing factor breakdown. Streak rewards showcase. Recruiter section with "8 Perfect Candidates Found" UI preview. Data moat CTA links (Skills, Salary, Jobs).

### 1.1 Repository layout (where code lives)

| Area | Path | Notes |
|------|------|--------|
| Job seeker UI | `app/(dashboard)/` | Route group: dashboard, tools, insights pages; uses `DashboardLayout` + `Sidebar` + `Topbar` + **`ProfileCompletionBanner`**. |
| Recruiter UI | `app/(recruiter)/` | `RecruiterLayout` + `RecruiterSidebar` + `NotificationBell` + **`ProfileCompletionBanner`**; role guard in layout. |
| API | `app/api/**` | ~83 `route.ts` files; each folder = REST resource. |
| Shared UI | `components/` | Feature folders (`dashboard/`, `resume/`, `applications/`, `auto-apply/`, …), `components/layout/`, `components/ui/`. |
| Server libs | `lib/` | Auth, AI, engines (auto-apply, smart-apply, streak, …), Supabase clients, `buildDocx`, validation. |
| Client hooks | `hooks/queries/` | TanStack Query wrappers around `apiFetch`. |
| Types | `types/` | Resume, analysis, recruiter, auto-apply, etc. |
| E2E | `e2e/` | Playwright specs + mock auth helpers. |
| DB | `supabase/` | `schema.sql`, `migrations/`, `grants.sql`. |
| Parsers | `utils/` | `pdfParser.ts`, `docxParser.ts` — server-side text extraction (used by `/api/upload-resume`, `/api/public/extract-resume`). |

---

## 2. Entry and auth

### 2.1 Middleware (`middleware.ts`)

- Runs on every request (except static assets). Calls `updateSession()` from `lib/supabase/middleware.ts` to refresh Supabase session cookies and returns the same Supabase client for follow-up queries. **E2E mock auth:** in non-production, cookies `e2e-mock-role` + `e2e-mock-secret` matching `E2E_MOCK_DEFAULT_SECRET` supply a synthetic Supabase `User` if real `getUser()` is null (Playwright does not need real Supabase passwords).
- **Recruiter path guard (non-API):** If the path starts with `/recruiter` and the user is authenticated, middleware checks `public.users.role` (or E2E mock role). If not `recruiter`, redirects to `/select-role?next=<original path>`.
- **Protected path prefixes:** `/dashboard`, `/resume-builder`, `/resume-analyzer`, `/job-match`, `/job-board`, `/job-finder`, `/auto-apply`, `/smart-apply`, `/tailor-resume`, `/cover-letter`, `/interview-prep`, `/import-linkedin`, `/applications`, **`/messages`**, `/analytics`, `/activity`, `/salary-insights`, `/skill-demand`, `/resume-performance`, `/career-coach`, `/streak-rewards`, `/onboarding`, `/select-role`, `/recruiter`, `/history`, `/pricing`, `/settings`, and **most** `/api/*`. **API exceptions (no session required):** `/api/auth/*`, `/api/platform-stats`, `/api/public/*` (public resume extract / fresher flows), `/api/share-result`, `/api/share/` (paths starting with this prefix — note `POST /api/share` without trailing slash is still protected). **Public pages (not listed above):** `/`, `/login`, `/signup`, `/demo`, `/share/[token]`, `/u/[slug]`, `/results/[token]`, `/jobs`, `/jobs/[slug]`, `/salary`, `/salary/[slug]`, `/skills`, etc.
- **Behavior:** If unauthenticated on a protected path: API → 401 JSON; page → redirect to `/login?next=<path>`. If authenticated but email not confirmed (`!user.email_confirmed_at`) on a **non-API** page → redirect to `/login?error=verify`.
- **Authenticated landing:** If the user has a session and visits `/`, `/login`, `/login/*`, `/signup`, or `/signup/*`, middleware redirects to the default app home (`/dashboard` or `/recruiter`) using `lib/auth-landing-path.ts` (`getDefaultAppPath`: `last_active_role` / `role`, or E2E mock role). Session cookies from `updateSession` are copied onto the redirect. Unconfirmed users hitting `/` or `/signup` are sent to `/login?error=verify`; unconfirmed users on `/login` stay on login (so the verify loop does not repeat).

### 2.2 Auth callback (`app/auth/callback/route.ts`)

- GET: reads `code` and `next` from query. Exchanges `code` for session via `supabase.auth.exchangeCodeForSession`, calls `ensureUserRow(userId, email)`, optional `role` query updates `users.role` + `last_active_role`, then redirects to `origin + sanitizeRedirectPath(next)` (or `/login?error=auth` on failure). When `next` is default `/dashboard`, may redirect to `/recruiter` if `last_active_role` / `role` is recruiter.
- `sanitizeRedirectPath`: allows only paths starting with `/`, no `//` or `://` (open-redirect safe).

### 2.3 Auth lib (`lib/auth.ts`)

- **getUser():** If E2E mock cookies are valid (`lib/e2e-auth.ts`), returns fixed mock id/email/profile for `recruiter` or `job_seeker` without hitting Supabase Auth. Otherwise: gets Supabase auth user; loads profile from `public.users` (id, email, name, created_at, plan_type, role, last_active_role). If no profile, calls `ensureUserRow` then re-selects.
- **ensureUserRow(userId, email):** Upserts into `public.users` with `plan_type: "free"`, `role: "job_seeker"`, `last_active_role: "job_seeker"`, `onConflict: "id", ignoreDuplicates: true` so existing rows are not overwritten.
- **UserRole:** `"job_seeker" | "recruiter"` type. User profile includes `role` field.

### 2.4 Google OAuth troubleshooting (400 on `/auth/v1/authorize`)

When the browser shows **`GET .../auth/v1/authorize?provider=google ... 400 (Bad Request)`**, the request fails **before** Google’s consent screen. The app code (`signInWithOAuth` + `redirectTo`) is usually correct; fix **Supabase + Google Cloud** settings.

| Check | Action |
|-------|--------|
| **Google provider** | Supabase Dashboard → **Authentication** → **Providers** → **Google** → enable **Enable Sign in with Google** and paste **Client ID** and **Client Secret** from Google Cloud. |
| **Google redirect URI** | Google Cloud Console → **APIs & Services** → **Credentials** → your OAuth 2.0 Client → **Authorized redirect URIs** must include exactly: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback` (this is Supabase’s callback, **not** `localhost`). |
| **Supabase redirect URLs** | Supabase Dashboard → **Authentication** → **URL Configuration** → **Redirect URLs** must include every app callback you use, e.g. `http://localhost:3000/auth/callback` and production `https://yourdomain.com/auth/callback`. Missing entries cause **400** when the client sends `redirect_to` to `/authorize`. |
| **Site URL** | Same screen → **Site URL** should match your primary origin (e.g. `http://localhost:3000` for local dev). |

**Project ref in URL:** `khplqskyueridoioabio` is your Supabase project ref; Google’s redirect URI must use `https://khplqskyueridoioabio.supabase.co/auth/v1/callback`.

**Docs alignment:** `FEATURES_FLOW.md` §36 describes the OAuth flow; `TEST_CASES.md` §39 / §48 cover OAuth and “provider not enabled” messaging. **BUG-A** in §9.12 addresses user-friendly errors when the provider is disabled; a **400** on the authorize URL still requires **Dashboard** fixes above.

---

## 3. Database (Supabase Postgres)

**Schema reference:** `supabase/schema.sql`. Migrations in `supabase/migrations/`. After applying migrations, run `supabase/grants.sql` (or the GRANT section in schema) so `anon` and `authenticated` have table access; otherwise "permission denied for table" occurs.

| Table | Purpose |
|-------|--------|
| **users** | Profile per auth user: id (FK auth.users), email, name, plan_type (free/pro/premium), public_slug (unique, for `/u/[slug]`), headline, bio, avatar_url, profile_visible, profile_strength (0-100), is_boosted, boost_expires_at, boost_multiplier, candidate_rank_score, last_active_at. Synced by trigger `on_auth_user_created` → `handle_new_user()`; app uses `ensureUserRow` as backup. |
| **resumes** | Uploaded resumes: user_id, file_url, parsed_text, created_at, version_label, target_role, is_primary. |
| **resume_analysis** | ATS analysis per resume: resume_id (FK resumes), score (0–100), analysis_json, created_at. **No user_id**; access via RLS through resumes.user_id. |
| **improved_resumes** | AI-improved resume content: user_id, optional resume_id, improved_content (JSONB), job_title, job_description, created_at. RLS: auth.uid() = user_id. |
| **job_matches** | Job match results: user_id, optional resume_id, job_description, job_title, resume_text, match_score, missing_skills, analysis (JSONB). |
| **cover_letters** | Generated cover letters: user_id, company_name, job_title, job_description, content, resume_text. |
| **interview_sessions** | Interview prep: user_id, role, experience_level, content_json. |
| **usage_logs** | Per-user, per-feature usage for limits: user_id, feature, timestamp. |
| **user_preferences** | career preferences (experience_level, preferred_role, etc.). |
| **subscriptions** | Billing (stripe/razorpay ids, plan_type, status, current_period_end). |
| **job_searches** | Auto job finder results: user_id, resume_text, extracted_skills (JSONB), job_results (JSONB), search_query, location. |
| **applications** | Job application tracker: user_id, company, role, status (saved/applied/interviewing/offer/rejected/withdrawn), applied_date, url, salary, location, notes, resume_id?, cover_letter_id?, interview_date, offer_amount, rejection_reason, response_days. |
| **companies** | Recruiter company profiles: recruiter_id, name, description, website, logo_url, industry, size, location, culture, benefits. |
| **job_postings** | Recruiter job posts: recruiter_id, company_id?, title, description, requirements, skills_required (JSONB), experience_min/max, salary_min/max, salary_currency, location, work_type, employment_type, status (draft/active/paused/closed), application_count. |
| **job_applications** | Candidates applying to recruiter jobs: job_id, candidate_id, recruiter_id, resume_id?, resume_text, cover_letter, stage (applied→shortlisted→interview_scheduled→interviewed→offer_sent→hired/rejected), match_score, ai_summary, ai_screening (JSONB), recruiter_notes, recruiter_rating, interview_date, interview_notes. UNIQUE(job_id, candidate_id). |
| **messages** | Messages between recruiters and candidates: sender_id, receiver_id, job_id?, subject, content, is_read, **read_at** (when receiver read), template_name; optional **attachment_path** / **attachment_name** / **attachment_mime** (Storage **`message-attachments`**). |
| **message_templates** | Reusable message templates: recruiter_id, name, subject, content, template_type (general/interview_invite/rejection/offer/follow_up). |
| **saved_searches** | Recruiter saved candidate search alerts: recruiter_id, name, filters (JSONB). |
| **ai_cache** | AI response cache: hash (TEXT PK), response (JSONB), feature, expires_at. RLS: authenticated can read/write all rows. TTL varies by feature (7d resume, 1d jobs). |
| **auto_apply_runs** | Auto-apply run tracking: user_id, resume_id, status (pending/processing/ready_for_review/confirmed/completed/failed), config (JSONB), results (JSONB array of matched jobs), jobs_found, jobs_matched, jobs_applied, error_message. |
| **notifications** | User notifications: user_id, type (info/success/warning/auto_apply/application/message), title, message, data (JSONB), read (boolean). |
| **smart_apply_rules** | Smart auto-apply rules: user_id, resume_id, enabled, rules (JSONB: min_match_score, salary range, preferred_roles, locations, include_remote, daily/weekly limits), last_run_at, next_run_at, total_runs, total_applied. UNIQUE(user_id, resume_id). RLS: own rows only. |
| **skill_badges** | User skill badges for public profiles: user_id, skill_name, level (beginner/intermediate/expert), years_experience, verified. UNIQUE(user_id, skill_name). RLS: users manage own, anyone can view. |
| **candidate_skills** | Indexed skills for recruiter search/candidate graph: user_id, skill, skill_normalized, years_experience, proficiency. UNIQUE(user_id, skill_normalized). Indexed on skill_normalized for fast search. Auto-populated from structured resume. |
| **activity_feed** | User activity log: user_id, activity_type (application_submitted, interview_scheduled, offer_received, resume_improved, skill_added, profile_updated, milestone, auto_apply_completed, score_improved), title, description, metadata (JSONB), is_public. Indexed on user_id+created_at and is_public+created_at. RLS: own rows + public rows visible to all. |
| **platform_stats** | Cached platform-wide aggregates for social proof: total_users, total_applications, total_interviews, total_hires, total_resumes_improved, avg_match_score. Single row (id='global'). Anyone can read, service role updates. |
| **recruiter_pushes** | Recruiter → candidate push notifications: recruiter_id, candidate_id, job_id?, push_type (job_invite/interview_request/profile_view/shortlisted), title, message, read. Rate limited to 10/recruiter/day. Also creates regular notification for bell display. |
| **hiring_outcomes** | Training data for hiring success prediction: job_id, candidate_id, recruiter_id, match_score, interview_score, was_hired, days_to_hire, skills_matched[], skills_missing[], job_title, job_location, salary_offered. |
| **salary_data** | Salary intelligence: job_title, normalized_title, location, experience_years, salary_min/max/avg, currency (INR), source (platform/user_reported/job_posting), data_points. Indexed on normalized_title and location. |
| **skill_demand** | Skill demand tracking by month: skill_name, normalized_skill, demand_count, supply_count, demand_trend (% MoM), avg_salary, top_roles[]. UNIQUE(normalized_skill, month). Refreshed via cron from job postings and candidate skills. |
| **resume_analysis.share_token** | Optional TEXT column on resume_analysis for public shareable score cards. |
| **resumes.structured_json** | Optional JSONB column on resumes for cached structured resume data (skills, experience, projects, education, preferred_roles). Lazy-populated on first access via `lib/resumeStructurer.ts`. Auto-syncs to candidate_skills and skill_badges on creation. |
| **user_streaks** | Streak tracking per user: current_streak, longest_streak, last_active_date, total_active_days, streak_multiplier. UNIQUE(user_id). Updated on every meaningful activity. |
| **daily_actions** | Personalized daily to-do items: action_date, action_type (apply_jobs/improve_resume/check_matches/prep_interview/update_skills/review_analytics/tailor_resume/explore_salary/boost_profile/respond_recruiter/check_competition), title, description, priority (0=normal, 1=high, 2=urgent), completed, completed_at. UNIQUE(user_id, action_date, action_type). Auto-generated on first dashboard visit each day. |
| **opportunity_alerts** | Time-sensitive opportunities: alert_type (high_match_job/trending_role/recruiter_interest/salary_spike/low_competition/deadline_approaching/new_skill_demand), urgency (low/normal/high/urgent), action_url, expires_at. Dismissable. Scanned via cron. |
| **users.xp_points** | XP points earned through activities. Multiplied by streak multiplier. |
| **users.streak_freeze_count** | Number of streak freeze tokens available (preserves streak if 1 day missed). |

**RLS:** All tables have RLS; policies scope by `auth.uid()` (own user or own related row). `resume_analysis` uses `EXISTS (resumes.id = resume_analysis.resume_id AND resumes.user_id = auth.uid())`. **Recruiter candidate search:** migration `20260402120000_recruiter_candidate_search_rls.sql` adds policies so authenticated **recruiters** can `SELECT` **job_seeker** rows in `users`, plus related `resumes`, `user_preferences`, and `resume_analysis` for search/detail APIs (otherwise list returned `[]`). **Recruiter-triggered ATS:** `20260402170000_recruiter_insert_resume_analysis.sql` adds `INSERT` on `resume_analysis` for recruiters when the resume belongs to a job seeker (required for **POST /api/recruiter/resumes/[resumeId]/analyze**). **Do not** use raw `EXISTS (SELECT … FROM public.users …)` inside those policies — it causes infinite RLS recursion; `20260402150000_fix_users_rls_recursion.sql` replaces checks with `auth_is_recruiter()` / `user_is_job_seeker(uuid)` / `resume_belongs_to_job_seeker(uuid)`. **Messaging:** job seekers cannot `SELECT` recruiter rows in `users` under RLS, so **POST /api/messages** must not rely on a direct `users` lookup for the recipient — migration **`20260402180000_user_role_for_messaging_rpc.sql`** adds **`user_role_for_id(uuid)`** (`SECURITY DEFINER`, returns `role` or null) for recipient validation. **`search_message_recipients`** ( **`20260404100000_search_message_recipients.sql`**, hardened **`20260404110000_messaging_search_hardening.sql`**) powers name/email recipient search for the compose **To** field. **Realtime:** migration **`20260404130000_realtime_messages_publication.sql`** adds **`public.messages`** to **`supabase_realtime`** so **`useMessages`** can **`postgres_changes`** subscribe (invalidate React Query when the other party inserts/updates a row). Requires valid Supabase browser session (RLS applies). **Peer display:** **`20260405100000_avatars_bucket_and_peer_profiles.sql`** — Storage bucket **`avatars`** (public read; authenticated insert/update/delete only under **`{auth.uid()}/…`**); RPC **`messaging_peer_profiles(p_peer_ids uuid[])`** (**`SECURITY DEFINER`**) returns **`id, name, avatar_url`** for ids that have at least one **`messages`** row with **`auth.uid()`** (used by **`GET /api/messages`**). **Company logos:** **`20260405130000_company_logos_bucket.sql`** — bucket **`company-logos`**, same folder rule (**`{auth.uid()}/…`**). Job seekers and recruiters remain one `users` table distinguished by `role` — no duplicate tables. Recruiter tables: recruiters manage own rows; candidates can view/insert their own applications; anyone can view active job_postings and companies. Platform stats, salary data, skill demand are publicly readable.

---

## 4. Lib layer (server-side and shared)

**Supplementary (shared client / helpers)** — used across UI and server:

| File | Role |
|------|------|
| **lib/api-fetcher.ts** | `apiFetch<T>` — JSON wrapper; throws on `!res.ok` with body text. **`apiFetchBlob`** — returns `Blob`. **`apiFetchJsonWithHumanizer`** / **`apiFetchFormJsonWithHumanizer`** — parse `{ error, detail }` then run a `humanize*` from **`lib/friendlyApiError.ts`** (used by resume/cover/upload **`hooks/mutations/*`**). **`apiFetchMultipartJson`** — multipart POST, JSON response (e.g. **`usePublicExtractResume`**). For custom flows, **`lib/api-error.ts`**. |
| **lib/api-error.ts** | Parses JSON error bodies `{ error?, detail? }` from API responses; **`formatApiError`**, **`formatApiFetchThrownError`** (for `Error.message` from **`apiFetch`**) for user-facing strings. |
| **lib/query-provider.tsx** | App-wide `QueryClientProvider` with sensible defaults (stale time, retry). Wraps client tree in root layout. |
| **lib/normalizeImprovedResume.ts** | `normalizeImprovedResumeContent(raw)` — coerces AI JSON into consistent `ImprovedResumeContent` (five sections). Used by improve-resume and LinkedIn import paths. |
| **lib/friendlyApiError.ts** | `humanizeUploadResumeError`, `humanizeImproveResumeError`, `humanizeCoverLetterError`, `humanizeSmartApplyError`, `humanizeNetworkError` — maps API error strings to user-facing copy (401, 429, Pro gates). |
| **lib/utils/cn.ts** | `cn(...)` — `clsx` + `tailwind-merge` for conditional classNames (used by UI primitives). |
| **lib/e2e-auth.ts** | Playwright mock auth: validates `e2e-mock-role` / `e2e-mock-secret` cookies vs `E2E_MOCK_DEFAULT_SECRET`; exports mock user ids/emails. Consumed by `lib/auth.ts` and `lib/supabase/middleware.ts`. |

**Domain and infrastructure** (primary server modules):

| File | Role |
|------|------|
| **lib/supabase/server.ts** | `createClient()` for server: uses Next `cookies()` (getAll/setAll). Used in Server Components and API routes. |
| **lib/supabase/middleware.ts** | `updateSession(request)`: creates Supabase client with request/response cookies, calls `getUser()` to refresh session, returns `{ response, user, supabase }` for follow-up queries (e.g. `public.users.role`). |
| **lib/auth-landing-path.ts** | `getDefaultAppPath(supabase, userId, e2eRole)` → `/dashboard` or `/recruiter` (same rules as post-login). `redirectWithSessionCookies(sessionResponse, url)` for redirects after session refresh. |
| **lib/supabase/client.ts** | Browser Supabase client (if used). |
| **lib/auth.ts** | See §2.3. |
| **lib/ai.ts** | `aiGenerate(systemPrompt, userContent, { jsonMode? })`, `aiGenerateContent(prompt)`. Prefers Gemini; on 429/quota/rate-limit error falls back to OpenAI if `OPENAI_API_KEY` set. Cached wrappers: `cachedAiGenerate(system, user, { jsonMode?, cacheFeature? })`, `cachedAiGenerateContent(prompt, cacheFeature?)` — check ai_cache first, store on miss. |
| **lib/aiCache.ts** | `generateCacheKey(feature, content)` — SHA-256 hash of full normalized content. `getCachedResponse(hash)`, `setCachedResponse(hash, response, feature)`. Feature TTLs: resume_analysis/resume_improve/skill_extraction 7d, job_match/job_finder 1d. |
| **lib/resumeStructurer.ts** | `getOrCreateStructuredResume(resumeId, userId)` — lazy extraction. Checks `structured_json` column first, calls AI on miss, persists to DB. Auto-syncs to `candidate_skills` and `skill_badges` on first extraction (non-blocking). Returns `StructuredResume`. |
| **lib/autoApplyScorer.ts** | `preFilterScore(resume, job, preferredLocation?)` — JS-only scoring (0-100): skill_overlap * 0.6 + experience * 0.3 + location * 0.1. Uses word-boundary regex matching to avoid false positives (e.g. "react" won't match "reaction"). `rankJobs(resume, jobs, topN, preferredLocation?)` — sort and return top N. |
| **lib/autoApplyEngine.ts** | `runAutoApply(runId, userId, config)` — orchestrator: get structured resume → fetch Adzuna + internal jobs → pre-filter rank → deep AI match top N → compute interview probability per job → update run with results. Fire-and-forget with 2-minute timeout safety net from API route. |
| **lib/interviewScore.ts** | `calculateInterviewProbability(userId, structured, jobTitle, jobDesc, matchScore, atsScore?)` — JS-only scoring (no AI cost). Returns `{ score, level: HIGH/MEDIUM/LOW, reasons[], boost_tips[] }`. Factors: skill overlap, experience, ATS quality, historical success. **Weights dynamically adjusted** by Learning Engine based on user's application outcomes. |
| **lib/learningEngine.ts** | `getApplicationInsights(userId)` — analyzes application history: interview rate, offer rate, avg response time, best/worst performing skills/roles, dynamic weight adjustments. `getConversionFunnel(userId)` — pipeline funnel counts. Used by interviewScore.ts and analytics page. |
| **lib/dailyReport.ts** | `generateDailyReport(userId)` — summarizes last 24h activity (jobs found, applied, interviews, responses, top matches, action items). `sendDailyReportNotification(userId)` — sends as notification. Called from cron trigger. |
| **lib/recruiterIntelligence.ts** | `getRecruiterIntelligence(recruiterId)` — hiring metrics (time-to-hire, conversion rates), pipeline health (by stage, stale apps), source performance, top jobs, AI recommendations. |
| **lib/smartApplyEngine.ts** | `getActiveSmartRules()`, `executeSmartRule(rule)`, `runAllSmartRules()` — checks rules, creates auto-apply runs, auto-selects qualifying jobs, auto-confirms applications, respects daily/weekly limits, notifies user. Called from `/api/smart-apply/trigger`. |
| **lib/candidateGraph.ts** | `syncCandidateSkills(userId, structured)` — upserts skills with proficiency to `candidate_skills` table. `syncSkillBadges(userId, structured)` — upserts skill badges for profile. `findSimilarCandidates(userId, limit)` — Jaccard similarity search across candidate_skills. |
| **lib/publicProfile.ts** | `generateSlug(name)` — URL-friendly slug with random suffix. `calculateProfileStrength(profile)` — 0-100 based on completeness (name, headline, bio, avatar, skills, resume, ATS score). `ensurePublicSlug(userId, name)` — creates unique slug if not exists. |
| **lib/recalculate-profile-strength.ts** | **`recalculateProfileStrengthForUser(supabase, userId)`** — reads **`users`** + skill/resume/ATS counts, writes **`users.profile_strength`**. Used by **`PATCH /api/profile`**, **`POST`/`DELETE /api/user/avatar`**. |
| **lib/avatar-storage.ts** | **`avatarStoragePathFromPublicUrl(url)`** — parses Storage path from a public **`avatars`** object URL (for delete/replace on upload). |
| **lib/message-attachments.ts** | **`MESSAGE_ATTACHMENTS_BUCKET`**, allowed MIME + size constants; **`isAttachmentPathOwnedBySender`**, **`safeAttachmentFileName`**, **`messagesWithSignedAttachmentUrls`** (signed **`attachment_url`** for **`GET /api/messages`** and thread). |
| **lib/company-logo-storage.ts** | **`companyLogoStoragePathFromPublicUrl(url)`** — same for **`company-logos`** URLs. |
| **lib/image-upload-validate.ts** | **`IMAGE_UPLOAD_MAX_BYTES`**, **`ALLOWED_IMAGE_MIME`**, **`validateImageMagicBytes`**, **`extensionForImageMime`** — shared by user avatar and company logo routes. |
| **lib/notifications.ts** | **`createNotification`** — inserts for the **current** user (RLS). **`createNotificationForUser`** — inserts for **another** user via **`createServiceRoleClient`** when **`SUPABASE_SERVICE_ROLE_KEY`** is set (e.g. **POST /api/messages** notifies **`receiver_id`**). If the service role client is missing, logs **`notification_delivery_skipped`** (monitorable prefix). Insert failures log **`notification_insert_failed`** (no longer fully silent). |
| **lib/activityFeed.ts** | `logActivity(userId, type, title, description?, metadata?, isPublic?)` — logs user activity. `getUserActivityFeed(userId, limit, offset)` — own activities. `getPublicActivityFeed(limit)` — public milestones. `checkAndLogMilestones(userId)` — auto-detects and logs application milestones (10/25/50/100/250/500). |
| **lib/socialProof.ts** | `getPlatformStats()` — reads cached stats from platform_stats table. `refreshPlatformStats()` — aggregates across users/applications/hires, updates cached row. Called from cron. |
| **lib/recruiterPush.ts** | `sendRecruiterPush(recruiterId, candidateId, pushType, title, message, jobId?)` — sends push notification to candidate. Rate limited to 10/day per recruiter. Also creates regular notification for bell display. `getCandidatePushes(candidateId)`, `markPushRead(pushId, candidateId)`. |
| **lib/hiringPrediction.ts** | `predictHiringSuccess(candidateSkills, jobTitle, jobSkillsRequired, matchScore, experienceYears, requiredExperience?)` — pure JS prediction model. Weighted factors: skill match (35%), experience fit (25%), historical success rate (25%), role demand (15%). **Historical filter now matches by job title keywords** (falls back to all outcomes if <5 matches). Returns probability (0-100), confidence (high/medium/low), factor breakdown, recommendations. `recordHiringOutcome(outcome)` — stores training data. |
| **lib/salaryIntelligence.ts** | `getSalaryIntelligence(jobTitle, location?, experienceYears?)` — salary ranges, percentiles (p25/p50/p75), trends (rising/stable/declining), comparable roles. Combines salary_data table + job_postings data. `ingestSalaryData(jobTitle, salaryMin?, salaryMax?, location?, experienceYears?)` — records salary data from job postings. |
| **lib/skillDemand.ts** | `getSkillDemandDashboard(userSkills)` — trending/declining/highest-paying/most-in-demand skills + user's skills analysis. `refreshSkillDemand()` — aggregates demand from active job postings, supply from candidate_skills, calculates MoM trends. Called from cron. |
| **lib/candidateBoost.ts** | `activateBoost(userId, durationDays?, multiplier?)` — enables profile boost. `checkBoostStatus(userId)` — auto-expires past deadline; **also reverts pro trial** — when boost expires and user is "pro" without active subscription, plan_type reverts to "free". `updateCandidateRank(userId)` — calculates rank score from profile strength, ATS score, skills count, activity, applies boost multiplier. `getTopCandidates(limit, skills?)` — ranked list for recruiters. |
| **lib/resumePerformance.ts** | `getResumePerformance(userId)` — tracks per-resume-version performance (applications, interviews, offers, rejection rates). Returns best resume ID, insights (e.g., "Jobs above 80% match score have 3x interview rate"), optimal daily apply count, role recommendations by interview rate. `getHiringBenchmark(userId)` — percentile rank vs all candidates, your score vs average. |
| **lib/candidateCompetition.ts** | `getJobCompetition(userId, jobId, matchScore)` — competitive position for a specific job (rank, percentile, competition level). `getOverallCompetition(userId)` — global ranking percentile, strongest skill, competitive advantage. |
| **lib/recruiterAutoPush.ts** | `autoPushCandidatesForJob(recruiterId, jobId, title, skills, limit?)` — auto-finds matching candidates by skills, sends push notifications. Deduplicates (won't push same candidate twice for same job). `runDailyRecruiterAutoPush()` — scans active jobs, pushes top 5 candidates per job. Called from cron. |
| **lib/shareableResults.ts** | `createShareableResult(userId, type, data)` — creates shareable token for any result type (ats_score, interview_probability, hiring_benchmark). `getSharedResult(token)` — retrieves shared result for public display. |
| **lib/streakSystem.ts** | `getUserStreak(userId)` — returns streak data with level, multiplier, next reward. `recordDailyActivity(userId, actionType)` — updates streak, awards XP with multiplier. Handles streak freeze (missed 1 day protection). Auto-calls `checkAndClaimRewards()` on milestone hits. Streak levels: Newcomer→Getting Started→On a Roll→Dedicated→Unstoppable→Legend→Champion. XP per action varies (apply=10, resume_analyze=15, resume_improve=20, interview_prep=25, daily_login=5). `getStreakLeaderboard(limit)`. |
| **lib/streakRewards.ts** | `getStreakRewards(userId, currentStreak)` — returns available/claimed rewards with progress. `claimStreakReward(userId, streakDays)` — grants real-value reward (streak freeze tokens, **auto-apply credits via usage_logs deletion**, profile boost, pro trial with expiry tracking, permanent boost with null expiry). `checkAndClaimRewards(userId, newStreak)` — auto-claims on milestone hit. Reward tiers: 3d=freeze, 7d=auto-apply, 14d=3-day boost, 21d=2 freezes, 30d=7-day boost+3 auto-applies, 50d=14-day 2.5x boost, 75d=pro trial, 100d=permanent 1.5x. |
| **lib/careerCoach.ts** | `getCareerDiagnosis(userId)` — full career analysis. Diagnoses problems (low ATS, wrong roles, low volume, generic resumes). Career direction per role (strong/moderate/weak by interview rate). Skill ROI ranking (highlight/learn/remove actions). Weekly summary with rate change. Score transparency breakdown (ATS categories, interview probability weights, rank components). Status: thriving/improving/struggling/critical/new. Pure JS, no AI cost. |
| **lib/instantShortlist.ts** | `getInstantShortlist(jobTitle, jobSkills, experienceMin?, experienceMax?, location?, limit?)` — finds top matching candidates instantly via candidate_skills graph. Composite scoring: skill overlap 50% + profile 20% + rank 20% + boost 10%. Returns candidates with matched/missing skills, score breakdown. Used by recruiter Instant Shortlist page. |
| **lib/dailyActions.ts** | `generateDailyActions(userId)` — context-aware daily to-do items. Gathers user context (resume status, applications, interviews, matches, pushes, streak). Builds prioritized actions: urgent (unread recruiter messages, pending interviews), high (low resume score, available matches), normal (analytics, competition, salary). Max 5 actions. `completeDailyAction(userId, actionId)`. `getDailyProgress(userId)` — completion stats. |
| **lib/opportunityAlerts.ts** | `getActiveAlerts(userId)` — non-dismissed, non-expired alerts. `createHighMatchAlert(userId, job, score)` — for 85%+ matches, with dedup. `createLowCompetitionAlert()`. `createRecruiterInterestAlert()`. `scanOpportunities(userId)` — checks recent auto-apply results for high matches, unresponded recruiter pushes. `dismissAlert()`, `markAlertSeen()`. |
| **lib/gemini.ts** | `isGeminiAvailable()`, `geminiGenerate`, `geminiGenerateContent`. Model: gemini-2.5-flash. Requires `GEMINI_API_KEY`. |
| **lib/openai.ts** | `isOpenAIAvailable()`, `chatCompletion(system, user, { jsonMode? })`. Model: gpt-4o-mini. Requires `OPENAI_API_KEY`. |
| **lib/usage-limits.ts** | Client-safe: **`FeatureType`**, **`FREE_PLAN_LIMITS`** (free monthly caps). Imported by dashboard UI; **`lib/usage.ts`** re-exports for server routes. |
| **lib/usage.ts** | `getUsageCount`, `canUseFeature`, `logUsage`, `checkAndLogUsage`, `getUsageSummary`. Uses **`FREE_PLAN_LIMITS`** from **`usage-limits.ts`**. **`getUsageSummary`** runs **8 parallel `COUNT` queries** (one per feature, monthly). Pro **`checkAndLogUsage`** returns accurate **`used`** after logging. |
| **lib/rateLimit.ts** | DB-backed rate limiter (serverless-safe): **`checkRateLimit(userId)`** — 10/min, feature **`rate_limit`**. **`checkRecipientSearchRateLimit(userId)`** — feature **`message_recipient_search`** for **`GET /api/messages/recipient-search`**; max/minute from **`RECIPIENT_SEARCH_RATE_LIMIT_MAX`** (default **45**, see **`lib/rate-limit-config.ts`**). **429** responses log JSON **`recipient_search_rate_limited`** to server logs. Shared implementation; fail-open on DB errors. |
| **lib/validation.ts** | `isValidUUID(id)`, `sanitizeRedirectPath(path, fallback)`, `escapeHtml(str)`. |
| **lib/buildDocx.ts** | `buildImprovedResumeDocx(content: ImprovedResumeContent)` → Buffer (DOCX). Used by download and export-docx APIs. Includes "Created with AI Job Assistant" watermark footer. |
| **lib/ats-resume-analysis.ts** | Shared ATS prompts and `runAtsAnalysisFromText(parsedText, { recheck?, previousAnalysis? })` (uses `cachedAiGenerateContent`). Used by **POST /api/analyze-resume** and **POST /api/recruiter/resumes/[resumeId]/analyze**. |
| **lib/resume-for-user.ts** | `getResumeParsedTextForUser` — strict load of resume `parsed_text` for the current user (cover letter generation). `getResumeForJobApplication` — same row for **POST /api/jobs/[id]/apply**; allows empty parsed text (stored as null). `getImprovedResumePlainTextForUser` — loads `improved_resumes.improved_content`, normalizes, flattens via **`improvedResumeContentToPlainText`** (**`lib/improved-resume-plaintext.ts`**) for apply and cover letter when user picks an AI improved resume. |
| **lib/job-posting-text.ts** | `buildJobPostingPromptText` — single plain-text blob from title, description, requirements, skills, location, work/employment type, company name (used for job-board cover letter context). |

**Client conventions (summary):** Prefer **`apiFetch`** + **`hooks/queries/*`** for reads; for cover letter generation use **`useGenerateCoverLetter`** so usage and dashboard queries stay in sync. Server routes should reuse **`lib/resume-for-user`** when resolving resume text by id instead of duplicating `select` blocks.

---

## 5. API routes (behavior and data flow)

All protected APIs use `getUser()`; 401 if no user. Many use `checkRateLimit(user.id)` and return 429 when not allowed. Feature-gated routes use `canUseFeature` and `logUsage`. **AI caching:** `/api/interview-prep`, `/api/import-linkedin`, `/api/auto-jobs`, `/api/recruiter/salary-estimate`, `/api/recruiter/jobs/generate-description`, `/api/recruiter/applications/[id]/screen`, `/api/recruiter/skill-gap`, `/api/recruiter/jobs/[id]/optimize`, and `/api/recruiter/jobs/[id]/auto-shortlist` use `cachedAiGenerate` (same arguments/JSON as uncached; cache hits read `ai_cache`).

| Route | Method | Purpose |
|-------|--------|--------|
| **/api/analyze-resume** | POST | Body: resumeText, resumeId?, recheckAfterImprovement?, previousAnalysis?. Validates; checks rate limit and resume_analysis feature; **`runAtsAnalysisFromText`** from `lib/ats-resume-analysis.ts`; inserts resume_analysis if resumeId matches owner; logs usage; returns ATSAnalysisResult. |
| **/api/upload-resume** | GET, POST | **GET:** List current user's uploaded resumes (`id`, derived `file_name`, `file_url`, `created_at`). **POST:** Multipart file (PDF/DOCX, max 5MB). Parses text, uploads to storage, inserts `resumes` row; returns `{ id, parsed_text }`. |
| **/api/improved-resumes** | GET | List current user's AI improved resumes for UI pickers: `{ improvedResumes: [{ id, label, created_at }] }` (`label` defaults from `job_title`). Used by **Job Board** apply alongside **GET /api/upload-resume**. |
| **/api/resume-file/[id]** | GET | On-demand signed URL generation (15-min expiry) for downloading resume files. Verifies ownership. Backward-compatible with legacy full URLs. |
| **/api/resume-analysis/[id]** | GET | Validates UUID; fetches resume_analysis by id (no user_id filter; RLS applies). Optionally loads resume parsed_text. Returns analysis + resume_text, resume_id. |
| **/api/improve-resume** | POST | Body: resumeText, resumeId?, jobTitle?, jobDescription?, previousAnalysis?. Pro-only (canUseFeature resume_improve). AI returns ImprovedResumeContent; inserts improved_resumes (user_id, resume_id if any, job_title, job_description); logs activity (resume_improved); returns { ...content, improvedResumeId }. |
| **/api/improved-resumes/[id]** | GET | Fetches improved_resumes by id and user_id. Returns id, improved_content, job_title, created_at. |
| **/api/improved-resumes/[id]/download** | GET | Query: format=docx. Fetches row by id and user_id; builds DOCX via buildImprovedResumeDocx; returns file. |
| **/api/improved-resumes/export-docx** | POST | Body: { content: ImprovedResumeContent }. Auth only. Builds DOCX from content (no DB row); returns file. Used when client has content but no saved id. |
| **/api/job-match** | POST | Body: resumeText, resumeId?, jobDescription, jobTitle?. Usage job_match; AI match; inserts job_matches (user_id, resume_id?, job_description, job_title, resume_text, match_score, analysis); logs usage; returns match result. |
| **/api/job-matches/[id]** | GET | Fetches job_matches by id and user_id. |
| **/api/generate-cover-letter** | POST | Body: **`jobDescription`** (required), plus at least one resume source. If multiple are sent, **priority** is **`improvedResumeId`** → **`resumeId`** → **`resumeText`**. Usage cover_letter; AI; inserts cover_letters; returns `{ coverLetter, id, companyName, jobTitle, createdAt }`. |
| **/api/cover-letters** | GET | List cover_letters for user. |
| **/api/cover-letters/[id]** | GET, PATCH, DELETE | Single cover letter by id and user_id. |
| **/api/interview-prep** | POST | Body: role, experienceLevel, resumeText?. Usage interview_prep; AI; inserts interview_sessions; returns content_json. |
| **/api/usage** | GET | Returns getUsageSummary for current user. |
| **/api/user** | GET, PATCH | GET: `id`, `email`, `name`, `plan_type`, `role`, `last_active_role`, **`headline`**, **`bio`**, **`avatar_url`**, **`profile_strength`**, `recruiter_onboarding_complete`, `preferences`. **PATCH:** name + preferences (validated/sanitized). **`recalculateProfileStrengthForUser`** runs only when **`name`** is present in the body (name affects strength); preference-only updates return current **`profile_strength`** without full recalc. No-op body returns current **`profile_strength`**. |
| **/api/user/avatar** | POST, DELETE | **POST:** multipart field **`file`** (JPEG/PNG/WebP, max 2MB, magic-byte checked) → Storage **`avatars/{userId}/…`**, public URL on **`users.avatar_url`**, **`recalculateProfileStrengthForUser`**. **DELETE:** clears **`avatar_url`**, removes prior object when URL matches this bucket. |
| **/api/dashboard** | GET | Aggregated dashboard payload: recent **`resume_analysis`** (via **`resumes!inner(user_id)`** + **`eq("resumes.user_id", user.id)`** — only the seeker’s own analyses), **`job_matches`**, **`cover_letters`**, application count, avg match score, **`getUsageSummary`**, user display name, plan. Used by **`useDashboardStats()`**. |
| **/api/history** | GET | Longer lists (limit 50) of analyses, matches, cover letters, improved resumes for history UI (`useHistory()`). |
| **/api/user/delete-account** | POST | Deletes related data (resumes, resume_analysis, improved_resumes, job_matches, cover_letters, usage_logs, etc.) then auth user. |
| **/api/dev/plan** | PATCH | Dev only (NODE_ENV === development). Body: planType (free|pro|premium). Updates users.plan_type for current user. |
| **/api/auto-jobs** | POST | Body: resumeText, location?. Extracts skills via AI, searches Adzuna API (if ADZUNA_APP_ID/ADZUNA_APP_KEY set) + generates AI job suggestions. Saves to job_searches. Usage: job_finder (free: 1/month). |
| **/api/auto-jobs/history** | GET | Lists past job searches for current user (max 20). |
| **/api/applications** | GET, POST | GET: list all applications for user. POST: create new application (company, role required; status, applied_date, url, salary, location, notes optional). Logs activity (application_submitted) and checks milestones. |
| **/api/applications/[id]** | GET, PATCH, DELETE | Single application by id and user_id. PATCH: partial update. DELETE: remove. |
| **/api/import-linkedin** | POST | Body: profileText (min 50 chars). AI parses LinkedIn profile text into ImprovedResumeContent JSON. |
| **/api/user/role** | PATCH | Body: `{ role }`. Updates `users.role` and `users.last_active_role`. Uses `SUPABASE_SERVICE_ROLE_KEY` when set (server-only); otherwise session client. E2E mock user IDs skip DB. On failure may return `detail` (Postgres message). Migration `20260402140000_users_update_policy_explicit_check.sql` sets explicit UPDATE `WITH CHECK` on `public.users`. |
| **/api/history** | GET | Lists up to 50 each: resume_analysis, job_matches, cover_letters, improved_resumes for current user. Used by `useHistory`. |
| **/api/jobs/applied** | GET | Returns `job_id[]` from `job_applications` for current user (recruiter-posted jobs already applied to). Empty array on error. |
| **/api/opportunity-alerts/scan** | POST | Auth. Triggers `scanOpportunities(userId)` for the current user (manual scan endpoint). |
| **/api/public/extract-resume** | POST | **Public** (no auth). Multipart `file` — extracts plain text from PDF/DOCX/TXT (max 4MB) for landing / pre-signup flows; text returned to client (e.g. sessionStorage). |
| **/api/public/fresher-resume** | POST | **Public.** JSON body (desired role, education, skills, projects). `cachedAiGenerate` returns `{ resumeText, atsScore }` for fresher landing → signup flows. |
| **/api/jobs** | GET | Public: list active job postings with filters (search, location, work_type, employment_type, skills). Paginated. |
| **/api/jobs/[id]** | GET | Public: single active job posting with company info. |
| **/api/jobs/[id]/apply** | POST | Job seeker applies to a job. Body: **`cover_letter`**, and optionally **`resume_id`** OR **`improved_resume_id`** (not both). Upload path: **`getResumeForJobApplication`**. Improved path: **`getImprovedResumePlainTextForUser`**; `job_applications.resume_id` is set to the improved row’s underlying `resumes.id` when present, else null; `resume_text` holds flattened improved content. Increments application_count. |
| **/api/recruiter/company** | GET, POST | **GET:** JSON **array** of companies for this recruiter (newest first). **POST:** create. |
| **/api/recruiter/company/[id]** | GET, PATCH, DELETE | Single company profile. |
| **/api/recruiter/company/[id]/logo** | POST, DELETE | Multipart **`file`** (JPEG/PNG/WebP, 2MB) → **`company-logos/{userId}/…`**, sets **`companies.logo_url`**. **DELETE** clears URL + removes storage object. |
| **/api/recruiter/jobs** | GET, POST | List/create job postings. |
| **/api/recruiter/jobs/[id]** | GET, PATCH, DELETE | Single job posting CRUD. |
| **/api/recruiter/jobs/generate-description** | POST | Body: `title`, optional `skills[]`, `work_type`, optional `experience_level` (entry|mid|senior|lead|executive), optional `experience_min` / `experience_max` (for prompt context). Returns JSON: **`description`**, **`requirements`**, **`skills_required`** (string array). Uses `cachedAiGenerate` with jsonMode + cache feature `job_description`. |
| **/api/recruiter/jobs/[id]/optimize** | POST | AI analysis of job posting: suggestions, optimized title/description, score. |
| **/api/recruiter/jobs/[id]/auto-shortlist** | POST | AI auto-screen applied candidates, shortlist top matches. Returns shortlisted count. |
| **/api/recruiter/applications** | GET | List applications for recruiter's jobs with filters (job_id, stage). |
| **/api/recruiter/applications/[id]** | GET, PATCH, DELETE | Single application: update stage, notes, rating, interview_date. |
| **/api/recruiter/applications/[id]/screen** | POST | AI screening of candidate resume against job requirements. Saves ai_screening JSONB. |
| **/api/recruiter/applications/[id]/interview** | POST, PATCH, DELETE | Schedule/reschedule/cancel interview. Updates interview_date, interview_notes, stage. |
| **/api/recruiter/candidates** | GET | Recruiter-only. Query: `skills`, `experience`, `location`, `page` (default 1), `pageSize` (default 25, max 100). Scans up to **5000** newest `job_seeker` rows with nested `resumes` + `user_preferences`, builds full filtered list (**includes users without resumes**; `has_resume` + `resume_preview` when text exists — preview is a **prefix** of parsed text, length in **`limits.resume_preview_chars`**). Skill/location filters match that preview text. Returns **JSON**: `{ candidates, page, pageSize, total, totalPages, truncated?, limits, search_quality: { model, note } }`. **`search_quality`** documents that this is **not** exhaustive full-text search over all users. `truncated` is true if the DB scan hit the 5000 cap. |
| **/api/recruiter/candidates/[id]** | GET | Detailed candidate: `users` + nested `resumes(resume_analysis(...))` + `user_preferences`. Job seeker only; 404 otherwise. On query failure, JSON may include **`detail`** (Postgres/PostgREST message) for debugging embed/select issues. |
| **/api/recruiter/resumes/[resumeId]/download** | GET | Recruiter-only. Returns JSON `{ url }` — signed URL (15 min) or legacy full URL for the resume file in `resumes` storage; verifies resume owner is `job_seeker`. |
| **/api/recruiter/resumes/[resumeId]/analyze** | POST | Recruiter-only. Runs ATS on the resume’s **`parsed_text`** (non-empty); `checkAndLogUsage(recruiter, "resume_analysis", …)`; inserts `resume_analysis`; requires RLS policy from **`20260402170000_recruiter_insert_resume_analysis.sql`**. Returns ATSAnalysisResult JSON. |
| **/api/messages** | GET, POST | Authenticated. **GET:** JSON **`{ messages, peer_profiles, has_more?, next_before?, partial? }`**. Each message may include **`read_at`**, attachment fields, and signed **`attachment_url`** when **`attachment_path`** is set. Query: **`limit`** (default **100**, max **200**), **`before`**, **`unread=true`**. Pagination: **`has_more`**, **`next_before`**; **`partial`** is **`true`**. **`peer_profiles`:** RPC **`messaging_peer_profiles`**. **POST:** **`receiver_id`**, **`content`** (or attachment-only with empty body stored as **`(attachment)`**), optional **`subject`**, **`job_id`**, **`template_name`**, optional **`attachment_path`** / **`attachment_name`** / **`attachment_mime`** (path must be under the sender’s Storage folder from **`POST /api/messages/attachment`**). **`user_role_for_id`**; recruiter ↔ job seeker only. **`createNotificationForUser`** on insert. |
| **/api/messages/thread** | GET | **Peer-scoped thread** (full conversation independent of inbox pagination). Query: **`peer_id`** (required UUID), **`limit`**, **`before`**. JSON: **`{ messages, peer_profiles, has_more, next_before, peer_id }`** — messages include signed **`attachment_url`** when applicable. Used by **`useThreadMessages`**. |
| **/api/messages/unread-summary** | GET | **`{ counts: Record<peerId, number> }`** — unread inbound **`messages`** grouped by **`sender_id`** (conversation partner). Drives sidebar/thread badges with **`useMessageUnreadSummary`**. |
| **/api/messages/mark-read** | POST | Body **`{ peer_id }`**. Marks inbound messages from that conversation partner as read for the current user (**`is_read`**, **`read_at`**). |
| **/api/messages/recipient-search** | GET | Query **`q`** (min 2 chars). Returns **`{ results: { id, name, email, role }[] }`** of opposite-role users matching name/email (compose **To** field). RPC **`search_message_recipients`** escapes **`%` / `_` / `\`** for **`ILIKE … ESCAPE '\'`**; ordering favors exact email, then prefix matches, then recent messaging activity (see **`20260407120000_messages_read_at_attachments_search_rank.sql`**). **`pg_trgm`** indexes on **`users.email`** / **`name`**. **Rate limit:** **`checkRecipientSearchRateLimit`**. **429** + **`Retry-After`**; **`recipient_search_rate_limited`** in logs. |
| **/api/messages/attachment** | POST | Multipart **`file`** — uploads to **`message-attachments/{userId}/…`**; JSON **`{ attachment_path, attachment_name, attachment_mime }`** for **`POST /api/messages`**. Max **5MB**; allowed types aligned with bucket policy. |
| **/api/recruiter/messages** | GET, POST | Re-exports the same **`GET`/`POST`** handlers as **`/api/messages`** (legacy path; clients may use either). |
| **/api/recruiter/templates** | GET, POST | Message templates CRUD. |
| **/api/recruiter/templates/[id]** | GET, PATCH, DELETE | Single template. |
| **/api/recruiter/alerts** | GET, POST | Saved search alerts CRUD. |
| **/api/recruiter/alerts/[id]** | PATCH, DELETE | Update/delete saved alert. |
| **/api/recruiter/skill-gap** | POST | AI skill gap analysis: matching_skills, missing_skills, transferable_skills, recommendations, gap_score. |
| **/api/recruiter/salary-estimate** | POST | AI salary estimation: min/max/median, factors, market_insight. |
| **/api/auto-apply** | GET, POST | POST: start auto-apply run (body: resume_id, location?, preferred_roles?, min_salary?, max_results?). Validates resume ownership, creates run record, fires engine async. Usage: auto_apply (free: 2/month). GET: list past runs (max 20). |
| **/api/auto-apply/[id]** | GET, PATCH | GET: poll run status + results. PATCH: update job selections (body: selected_job_ids[]). Only works when status=ready_for_review. |
| **/api/auto-apply/[id]/confirm** | POST | Apply to selected jobs. Creates application records in `applications` table (role, company, status=applied, applied_date, notes with match info). Updates run status to completed. Creates notification. |
| **/api/notifications** | GET, PATCH | GET: list notifications (max 30). PATCH: mark single read (body: { id }) or all read (body: { mark_all_read: true }). |
| **/api/share** | POST | Generate share token for resume_analysis. Body: { analysis_id }. Verifies ownership via resumes FK. Returns existing token or generates new one (32-char hex). |
| **/api/smart-apply** | GET, POST, PATCH | GET: list user's smart apply rules. POST: create/update rule (body: resume_id, min_match_score, salary range, preferred_roles, locations, include_remote, daily/weekly limits). Pro-only. PATCH: toggle enable/disable (body: { id, enabled }). |
| **/api/smart-apply/trigger** | POST | Unified cron endpoint: (1) `runAllSmartRules`, (2) daily report notifications (sample of recent auto-apply users), (3) `refreshPlatformStats`, (4) `refreshSkillDemand`, (5) `runDailyRecruiterAutoPush`, (6) `scanOpportunities` for users active in streaks (recent days), (7) delete stale `usage_logs` rows where `feature=rate_limit` older than 5 minutes, (8) delete expired `ai_cache` rows. Protected by `Authorization: Bearer CRON_SECRET` in production; dev allows unauthenticated POST. |
| **/api/profile** | GET, PATCH | GET: own public profile with badges, resume count, best ATS score. PATCH: update headline, bio, profile_visible. Auto-generates public slug on enable. **PATCH** ends with **`recalculateProfileStrengthForUser`** (same formula as avatar upload). |
| **/api/insights** | GET | Learning insights + conversion funnel for current user. Returns { insights: LearningInsights, funnel: ConversionFunnel }. |
| **/api/daily-report** | GET | Today's daily report for current user (jobs found, applied, interviews, responses, action items). |
| **/api/recruiter/intelligence** | GET | Hiring intelligence dashboard: metrics, pipeline health, source performance, top jobs, recommendations. Recruiter-only. |
| **/api/recruiter/candidates/[id]/similar** | GET | Find candidates with similar skill profiles using Jaccard similarity on candidate_skills. Recruiter-only. Returns top 10 with common skills and similarity score. |
| **/api/activity-feed** | GET | Query: public=true for community feed, otherwise user's own. Supports limit, offset. |
| **/api/platform-stats** | GET | Public. Returns cached platform-wide statistics (total users, applications, hires, avg match score). |
| **/api/recruiter/push** | POST | Recruiter sends push notification to candidate. Body: candidate_id, push_type, title, message, job_id?. Rate limited 10/day. Also creates regular notification. |
| **/api/recruiter/top-candidates** | GET | Ranked candidates list. Query: limit, skills (comma-separated filter). Recruiter-only. |
| **/api/hiring-prediction** | POST | Hiring success prediction. Body: candidate_skills[], job_title, job_skills_required[], match_score?, experience_years?, required_experience?. Returns probability, confidence, factor breakdown, recommendations. |
| **/api/salary-intelligence** | GET | Salary insights for a role. Query: title (required), location?, experience?. Returns salary range, percentiles, trend, comparable roles. |
| **/api/skill-demand** | GET | Skill demand dashboard. Returns trending, declining, highest-paying, most in-demand skills + user's skills analysis. |
| **/api/candidate-boost** | GET, POST | GET: check boost status. POST: activate boost (Pro+ only). Duration configurable. Premium gets 2.5x multiplier, Pro gets 2x. |
| **/api/resume-performance** | GET | Resume Performance Index + Hiring Benchmark. Returns per-resume metrics, best performer, insights, score threshold analysis, role recommendations, and percentile ranking. |
| **/api/competition** | GET | Overall competitive position: rank percentile, strongest skill, competitive advantage text. |
| **/api/share-result** | POST, GET | POST: create shareable link for any result (ats_score, interview_probability, hiring_benchmark). Returns token + URL. GET: retrieve shared result by token. |
| **/api/streak** | GET, POST | GET: current user's streak data (streak, level, multiplier, XP, freeze count). POST: record daily activity (body: { action_type? }). Called on dashboard load (daily_login) and from API routes (apply, resume_analyze, resume_improve). |
| **/api/daily-actions** | GET, PATCH | GET: today's personalized action items + progress. Auto-generates on first call each day. PATCH: mark action completed (body: { action_id }). Returns updated progress. |
| **/api/opportunity-alerts** | GET, PATCH | GET: active alerts (?scan=true to trigger opportunity scan). PATCH: dismiss or mark seen (body: { alert_id, action: "dismiss" | "seen" }). |
| **/api/career-coach** | GET | Full career diagnosis: status, problems, career direction, skill ROI, weekly summary, score explanations. Candidate-only. |
| **/api/streak-rewards** | GET, POST | GET: current streak + available/claimed rewards. POST: manually claim a reward (body: { streak_days }). Validates streak level before granting. |
| **/api/recruiter/instant-shortlist** | POST | Instant candidate shortlist for a job. Body: { job_title, skills_required[], experience_min?, experience_max?, location?, limit? }. Recruiter-only. Returns ranked candidates with match scores and skill breakdown. |

---

## 6. Pages and main components

| Page | Path | Behavior |
|------|------|----------|
| Landing | `/` | app/page.tsx — **client component** with Job Seeker / Recruiter tab toggle. **Free** tier pricing bullets use **`FREE_PLAN_LIMITS`** so marketing matches enforcement. CTAs link to `/signup?role=${activeTab}`. |
| Login | `/login` | Login form; redirect `next` sanitized. |
| Signup | `/signup` | Sign up. |
| Reset | `/login/reset` | Password reset. |
| Dashboard | `/dashboard` | **Client page** (`"use client"`). Data via **`useDashboardStats()`** → `GET /api/dashboard` (recent analyses, matches, cover letters, application count, avg match score, usage, name, plan). **ProductNarrativeBanner**, **StartHereChecklist** (3 steps; dismiss in `localStorage`), **StartHereActions**, **ExploreMoreActions**. Lazy-loaded: **StreakWidget**, **DailyActions**, **OpportunityAlerts**. **ScoreCard**, **JobMatchAvgCard**, **UsageCard**, **ActivityList** (recent activity derived from dashboard payload). |
| Resume Analyzer | `/resume-analyzer` | Client: upload, paste text, analyze, improve (optional job/analysis context). Query params: analysisId, improvedId (load past analysis or improved resume). State: improvedResumeId passed to ImprovedResumeView for DOCX download. Re-analyze improved resume uses analysisForRecheck snapshot. |
| Job Match | `/job-match` | JobMatchForm; calls /api/job-match; MatchResult. |
| Cover Letter | `/cover-letter` | CoverLetterForm; generate; CoverLetterResult. |
| Interview Prep | `/interview-prep` | Form (role, level, resume); InterviewQuestions. |
| History | `/history` | Uses **`useHistory()`** → `GET /api/history` for analyses, matches, cover letters, improved resumes. **HistoryImprovedResumeSection** and related components; handles load errors and empty states. |
| Auto Job Finder | `/job-finder` | Client: upload/paste resume + optional location; calls /api/auto-jobs; shows SkillsOverview (extracted skills) + JobResults (job cards with apply links, source filter). |
| AI Auto-Apply | `/auto-apply` | Client: Uses `usePastRuns`, `useStartAutoApply` hooks for list/start. Polling for run status updates still uses raw fetch (transient state). AutoApplyForm → AutoApplyProgress → AutoApplyResults flow. Past runs list. |
| Resume Tailoring | `/tailor-resume` | Client: upload/paste resume + paste job description; calls existing /api/improve-resume with jobTitle + jobDescription; renders ImprovedResumeView with download options. |
| LinkedIn Import | `/import-linkedin` | Client: upload LinkedIn PDF or paste profile text; calls /api/import-linkedin; renders ImprovedResumeView. |
| Smart Auto-Apply | `/smart-apply` | Client: Pro feature. Uses `useSmartApplyRules`, `useResumes`, `useUsage`, `useSaveSmartApplyRule`, `useToggleSmartApplyRule` hooks. Configure rules (match score slider, salary range, roles, locations, remote toggle, daily/weekly limits). View active rules with stats (total applied, total runs). Toggle enable/disable. How-it-works section. |
| Applications | `/applications` | Client: Uses `useApplications`, `useDeleteApplication`, `useUpdateApplicationStatus` hooks. CRUD application tracker with board (Kanban) and list views; stats row; status filter; inline status change. |
| Messages (job seeker) | `/messages` | Same **`MessagesInbox`** as recruiters (pagination + load older). Query params: **`compose=1`**, **`receiver_id=`**, **`peer=`**. |
| Career Analytics | `/analytics` | Client: AI-powered insights dashboard. Key metrics (applications, interviews, offers, avg response time). Conversion funnel (Saved→Applied→Interview→Offer). AI recommendations. Skills that get interviews vs roles to reconsider. Learning system status with dynamic weights. |
| Activity Feed | `/activity` | Client: Tabs for "My Activity" (personal) and "Community" (public milestones). Platform stats social proof banner (6 metrics). Activity timeline with typed icons and colors. |
| Salary Insights | `/salary-insights` | Client: Search by job title + location + experience. Shows salary range (min/avg/max), percentile distribution bar, trend (rising/stable/declining), comparable roles. |
| Skill Demand | `/skill-demand` | Client: Dashboard with sections — Your Skills in Market, Most In Demand, Trending Up, Highest Paying, Declining. Each skill shows demand/supply/trend/avg salary/top roles. Color-coded status (hot/growing/stable/declining/oversaturated). |
| Public Profile | `/u/[slug]` | **Public** server component. Shows avatar initial, name, headline, bio, profile strength bar, ATS score bar, skill badges (Expert/Intermediate/Beginner), signup CTA. No auth required. |
| Resume Performance | `/resume-performance` | Client: Resume Performance Index. Hiring benchmark (percentile ranking, your score vs avg). AI insights (best resume version, score threshold, optimal daily count). Per-resume-version metrics (apps, interviews, offers, rejection). Role performance chart. Share benchmark button. |
| Shared Result | `/results/[token]` | **Public**. Displays shared interview probability, hiring benchmark, or ATS score. OG meta for social sharing (WhatsApp, LinkedIn). Signup CTA. |
| SEO Jobs Index | `/jobs` | **Public** server component. Lists active job postings with SEO metadata. Links to individual job pages. Popular skills and locations for internal linking. |
| SEO Job Page | `/jobs/[slug]` | **Public** server component. Full job posting with JSON-LD structured data (JobPosting schema). OG meta. Skills, salary, requirements. Signup CTA for AI-powered application. |
| SEO Salary Page | `/salary/[slug]` | **Public** server component. Salary ranges, percentiles, common skills for any role. Format: `/salary/react-developer-in-bangalore`. SEO optimized. |
| Pricing | `/pricing` | Client: plan comparison (Free ₹0 / Pro ₹299 / Premium ₹499). Feature lists include smart auto-apply, profile boost, daily reports, hiring prediction. Upgrade buttons. |
| Job Board | `/job-board` | Client: browse active recruiter-posted jobs with search/filters. Apply with resume selection and optional cover letter; **Generate with AI** uses **`buildJobPostingPromptText`** + **`useGenerateCoverLetter`** (**resumeId** + composed job text). |
| Role Select | `/select-role` | Choose job_seeker or recruiter role; PATCH `/api/user/role`; awaits query refetch before `router.push` to avoid recruiter layout seeing stale role. |
| Settings | `/settings` | SettingsForm (**profile photo**, **profile strength** explainer `<details>`); DevPlanSwitcher (dev only) to toggle plan_type. |
| **Recruiter Dashboard** | `/recruiter` | Stats: active jobs, applications, **unread messages** (sum of **`GET /api/messages/unread-summary`** counts), quick actions, recent applications. |
| Recruiter Jobs | `/recruiter/jobs` | Job listings with status filter, toggle active/paused, delete. |
| New Job | `/recruiter/jobs/new` | Create job with AI description generator. |
| Edit Job | `/recruiter/jobs/[id]` | Edit job details, status, delete. |
| Optimize Job | `/recruiter/jobs/[id]/optimize` | AI job post optimization with score and suggestions. |
| Auto-Shortlist | `/recruiter/jobs/[id]/auto-shortlist` | AI auto-screen unreviewed applications. |
| Candidates | `/recruiter/candidates` | Loads page 1 on mount (**25 per page**; API allows up to **100**). Copy documents **resume text preview** length for filters. **`GET /api/recruiter/candidates`** returns **`limits`** plus **`truncated`** when the 5000-user scan cap is hit. |
| Candidate profile | `/recruiter/candidates/[id]` | Client page: **GET /api/recruiter/candidates/[id]**; preferences + resumes with ATS analysis (from `resume_analysis`), extracted text preview, **Download** + **Preview** (signed URL; PDF in iframe), **Run ATS analysis** (**POST /api/recruiter/resumes/[resumeId]/analyze** when `parsed_text` is present). **Message in app** → **`/recruiter/messages?compose=1&receiver_id=…`**; optional **Copy user ID** for support. |
| Applications (ATS) | `/recruiter/applications` | ATS pipeline (Kanban + list view), AI screening, rating, stage management. |
| Messages | `/recruiter/messages` | **`MessagesInbox`**: conversations + **Load older messages** (paginated **`GET /api/messages`**); banner when the inbox may be partial. Compose: **`?compose=1&receiver_id=`**, **`peer=`**. **`useMessages`** (**infinite query**) / **`useSendMessage`** (invalidates message queries) → **`/api/messages`**; thread open → **`POST /api/messages/mark-read`**. |
| Templates | `/recruiter/templates` | CRUD message templates (interview invite, rejection, offer, follow-up). |
| Company Profile | `/recruiter/company` | Company profile form. |
| Analytics | `/recruiter/analytics` | Dashboard with metrics, pipeline breakdown, top jobs. |
| Salary Estimator | `/recruiter/salary-estimator` | AI salary range estimation by title, skills, experience, location. |
| Skill Gap Report | `/recruiter/skill-gap` | AI analysis of candidate vs job skill match. |
| Top Candidates | `/recruiter/top-candidates` | Ranked candidates by profile quality, ATS score, activity. Skill filter. Boosted candidates highlighted. "Reach Out" sends push notification to candidate. |
| Instant Shortlist | `/recruiter/instant-shortlist` | Select a job → instant top candidates with skill match. Shows matched/missing skills, score breakdown (trust layer), rank, boost status. "Reach Out" individual or "Message All" bulk outreach. How-it-works explanation. |
| AI Career Coach | `/career-coach` | Full career diagnosis page. Status banner (thriving/improving/struggling/critical/new). Problems with fixes. Weekly performance summary. Career direction analysis per role. Skill ROI ranking (highlight/learn/remove). Score transparency section (interview probability weights, ATS breakdown, rank components). |
| Streak Rewards | `/streak-rewards` | Current streak overview with progress bar. Reward cards (locked/unlocked/claimed states). Claim button for unclaimed milestones. How-it-works explanation. |
| SEO Skills | `/skills` | **Public**. "Top Skills to Get Hired in 2026". Skills that guarantee interviews (demand/supply ratio), highest paying, trending, most in-demand. Data from skill_demand table. SEO metadata + OG tags. Signup CTA. |
| SEO Salary Index | `/salary` | **Public**. "Highest Paying Tech Roles 2026". Aggregated salary table with avg, range, data points. City links. SEO metadata + OG tags. Signup CTA. |
| Saved Alerts | `/recruiter/alerts` | Manage saved candidate search alerts. |
| Pricing Plans | `/recruiter/pricing` | Recruiter plan comparison (Starter ₹999 / Pro ₹4,999 / Enterprise ₹14,999). |
| Recruiter Settings | `/recruiter/settings` | Display name, **profile photo** (**`/api/user/avatar`**), role switch. |

### 6.1 Component catalog (`components/` — 64 TSX files)

Grouped by folder; each file is a React component unless noted.

**Layout (`components/layout/`)**

| Component | Role |
|-----------|------|
| **DashboardLayout** | Wraps job seeker pages: sidebar + topbar + **`ProfileCompletionBanner`** (job seeker: profile strength &lt; 70) + main content area. |
| **Sidebar** | Client; `navGroups` sections (Start here → Track & insights); **Messages** link to **`/messages`** (after Applications) with aggregate unread badge via **`useMessageUnreadState`** (mounts **`useMessageUnreadRealtime`**; wraps **`useMessageUnreadSummary`** with 30s polling fallback; overflow `9+`); mobile drawer, overlay, Escape to close, body scroll lock. |
| **Topbar** | **`useUser`** + **`useUsage`** (`GET /api/usage`): monthly resume/job chips; limits fall back to **`FREE_PLAN_LIMITS`** for free tier (not legacy 2/1). **Upgrade** only when user row is loaded and **`plan_type === free`**. **Messages** shortcut: **`/recruiter/messages`** if the route is under **`/recruiter`**, otherwise **`/messages`** (same rule as **`NotificationBell`** message links) + aggregate unread badge via **`useMessageUnreadState`** (mounts **`useMessageUnreadRealtime`**). **`NotificationBell`** remains separate. Tagline aligned with product (no hard multiplier claims). |
| **RecruiterLayout** | Used by `(recruiter)/layout.tsx`; enforces recruiter role (redirect to `/select-role?next=/recruiter` only when not loading/fetching; `useRecruiterUser` refetches on mount). **`ProfileCompletionBanner`** when no company row (`!recruiter_onboarding_complete`). |
| **RecruiterSidebar** | Full recruiter nav (jobs, candidates, ATS, messages, templates, company, analytics, salary, skill gap, instant shortlist, top candidates, alerts, pricing, settings). **Messages** item shows aggregate unread badge via **`useMessageUnreadState`** (mounts **`useMessageUnreadRealtime`**; overflow `9+`). |
| **RecruiterTopbar** | Recruiter header: **Messages** link (**`/recruiter/messages`**) with aggregate unread badge via **`useMessageUnreadState`** (mounts **`useMessageUnreadRealtime`**) + **NotificationBell**; optional **company logo** badge (**`useRecruiterCompany`**) next to **`UserAvatar`**. |
| **ProfileCompletionBanner** | Below **`Topbar`** / **`RecruiterTopbar`**: nudges job seekers until **`profile_strength` ≥ 70** and recruiters until **`recruiter_onboarding_complete`**. Path-aware: on **`/settings`** / **`/recruiter/company`** shows helper text instead of redundant “Go to settings” / “Add company” links. |
| **NotificationBell** | Loads **`/api/notifications`** (includes **`data` JSONB**). Realtime **`INSERT`** + **`UPDATE`** on **`notifications`** for the current user; toast on insert; click **message** notifications → **`/messages?peer=`** or **`/recruiter/messages?peer=`** from **`data.sender_id`**; mark read / mark all read with optimistic cache updates. |

**Dashboard (`components/dashboard/`)**

| Component | Role |
|-----------|------|
| **ProductNarrativeBanner** | Hero CTA strip toward resume analyzer / core value. |
| **StartHereChecklist** | 3-step onboarding checklist (ATS, job match, application); dismiss persisted in `localStorage`. |
| **StartHereActions** / **ExploreMoreActions** | Primary and secondary shortcut cards to main tools. |
| **ScoreCard** / **JobMatchAvgCard** / **UsageCard** | Latest ATS score, average job match %, monthly usage meters. |
| **ActivityList** | Recent activity derived from dashboard API data; empty state with suggested actions. |
| **StreakWidget** | Lazy-loaded; streak, level, XP multiplier, freeze tokens, progress to next reward (uses streak API hooks). |
| **DailyActions** | Lazy-loaded; `/api/daily-actions` checklist, priorities, completion progress. |
| **OpportunityAlerts** | Lazy-loaded; `/api/opportunity-alerts`; background `POST /api/opportunity-alerts/scan` decoupled from list load. |
| **QuickActions** | Compact action chips (where used). |

**Auto-apply (`components/auto-apply/`)**

| Component | Role |
|-----------|------|
| **AutoApplyForm** | Resume select, location, roles, salary, max results; starts `POST /api/auto-apply`. |
| **AutoApplyProgress** | Polling UI while run status is `pending` / `processing`. |
| **AutoApplyResults** | Review table/cards; PATCH selected jobs; confirm → `POST .../confirm`. |
| **JobMatchCard** | Per-job match %, interview probability (HIGH/MEDIUM/LOW), expandable reasons/boost tips, optional checkbox for batch apply. |

**Applications (`components/applications/`)**

| Component | Role |
|-----------|------|
| **ApplicationBoard** | Kanban + list views; drag/status updates via applications API hooks. |
| **ApplicationForm** | Create/edit single application fields. |

**Messages (`components/messages/`)**

| Component | Role |
|-----------|------|
| **MessagesInbox** | Shared UI for **`/messages`** and **`/recruiter/messages`**: **mobile (`< lg`) single-pane** (inbox list → thread/compose full-screen with **Back**), **desktop (`lg+`) split-pane** (list + thread). Compose supports **`?compose=1&receiver_id=`** (redirects to **`peer=`** when history exists). **`RecipientPicker`** (**`GET /api/messages/recipient-search`**). **`POST /api/messages/mark-read`** whenever the open thread contains unread inbound messages (gated by tab visibility/focus; clears unread summary optimistically and broadcasts via **`useMessagingReadSync`** so the peer refetches **`read_at`**). Attachments via **`POST /api/messages/attachment`**. **Sent/Read** on own bubbles; **`useMessagingTyping`**. Thread UX: auto-scroll to latest on open and after sending; incoming messages auto-scroll only when near bottom; otherwise show **Jump to latest**; renders a **New messages** divider before the first unread inbound message. Mobile composer uses **`safe-bottom`**. |
| **RecipientPicker** | Compose **To** field: debounced search, dropdown of matches; deep-linked **`receiver_id`** shows a locked recipient hint until changed. |

**Resume (`components/resume/`)**

| Component | Role |
|-----------|------|
| **ResumeUpload** | File upload + paste; drives upload/analyze flow on analyzer page. |
| **ResumeAnalysisResult** | ATS score UI, missing skills, improvements; may show **UpgradeBanner**, **FeedbackButtons**, **ShareScoreButton**. |
| **ImprovedResumeView** | Renders normalized five sections; copy plaintext; PDF via hidden iframe `print()`; DOCX via saved id GET or **POST** `/api/improved-resumes/export-docx`; XSS-safe escaping for print HTML. |

**Job & cover & interview & tailor & LinkedIn**

| Path | Components |
|------|------------|
| **job/** | **JobMatchForm**, **MatchResult** — job match flow; feedback/share on result. |
| **job-finder/** | **JobFinderForm**, **SkillsOverview**, **JobResults** — auto-jobs search, source filter. |
| **cover-letter/** | **CoverLetterForm**, **CoverLetterResult**. |
| **interview/** | **InterviewQuestions** — grouped Q&A display. |
| **tailor/** | **TailorResumeForm** — tailor via improve-resume API. |
| **linkedin/** | **LinkedInImportForm** — paste/upload → import API. |

**Landing (`components/landing/`)**

| Component | Role |
|-----------|------|
| **LandingRoleToggle** | Switches Job Seeker vs Recruiter tab on `/`. |
| **JobSeekerLanding** / **RecruiterLanding** | Tab-specific hero, steps, proof sections. |
| **HeroResumeCTA** | Resume CTA block. |
| **JobSeekerProofSection** | Social proof metrics. |
| **LandingTrustPreview** | Score/candidate preview cards. |
| **CreateResumeFresherFlow** | Fresher path; may call **POST `/api/public/fresher-resume`**. |
| **landingShell** / **landingPaths** / **landingTypes** | Shared layout/constants/types for landing. |

**Auth (`components/auth/`)**

| Component | Role |
|-----------|------|
| **auth-split-shell** | Two-column layout for login/signup pages. |
| **auth-trust-signals** | Trust badges (3.2× users, etc.). |

**UI primitives (`components/ui/`)**

| Component | Role |
|-----------|------|
| **UserAvatar** | Initials fallback or image for **`avatar_url`**; used in **`MessagesInbox`**, **`SettingsForm`**. |
| **Button**, **Card** (with header/title/description/content/footer), **Input** (incl. Textarea, Select), **Label** | Styled form building blocks; **Button** has variants/sizes. |
| **PageLoading** | Full-page/section loading states for route `loading.tsx`. |
| **SectionSkeleton** | **CardRowSkeleton**, **ListSkeleton**, etc., for dashboard lazy boundaries. |
| **ProgressBar** | Determinate progress. |
| **AIProgressIndicator** | Indeterminate AI step indicator. |
| **EmptyState** | Icon + title + description + action. |
| **UpgradeBanner** | Usage-limit nudges (amber/red) when `_usage` near zero. |
| **FeedbackButtons** | Thumbs up/down → **POST `/api/feedback`**. |
| **ShareScoreButton** | Native share or clipboard for scores. |
| **SuccessAnimation** | Full-screen success overlay; `onDone` via ref to avoid effect loops. |
| **index.ts** | Re-exports Button, Card, Input, Label, PageLoading. |

### 6.2 Cross-cutting behavior (summary)

- **ImprovedResumeView** — central to analyzer, tailor, LinkedIn import; always uses **normalizeImprovedResumeContent** upstream.
- **FeedbackButtons** — wired on **ResumeAnalysisResult**, **MatchResult**, **CoverLetterResult**.
- **ShareScoreButton** — **ResumeAnalysisResult**, **MatchResult**.
- Lazy **Suspense** boundaries on dashboard for **StreakWidget**, **DailyActions**, **OpportunityAlerts** to reduce initial JS.

### 6.3 TanStack Query hooks (`hooks/queries/`)

Each file exports one or more `use*` hooks; all use `apiFetch` unless noted.

| File | APIs touched (typical) |
|------|-------------------------|
| **use-user.ts** | `GET /api/user`; **`useDeleteAccount`** → `POST /api/user/delete-account`; **`useUploadAvatar`** / **`useRemoveAvatar`** → **`POST`/`DELETE /api/user/avatar`** (updates **`userKeys.me()`** + **`recruiterKeys.user()`** cache + invalidates both). |
| **use-dashboard.ts** | `GET /api/dashboard`, `GET /api/history` |
| **use-applications.ts** | `GET/PATCH/DELETE /api/applications`, `/api/applications/[id]`; **`useSaveApplication`** (POST create or PATCH by id) |
| **use-auto-apply.ts** | `GET /api/auto-apply`, `GET /api/auto-apply/[id]`, `POST /api/auto-apply`, `PATCH /api/auto-apply/[id]` (selections), `POST /api/auto-apply/[id]/confirm` |
| **use-smart-apply.ts** | `GET/POST/PATCH /api/smart-apply`, `GET /api/upload-resume`, `GET /api/usage` |
| **use-job-board.ts** | `GET /api/jobs`, `GET /api/jobs/applied`, `GET /api/upload-resume`, `GET /api/improved-resumes`, `POST /api/jobs/[id]/apply` (optional `improved_resume_id`) |
| **use-recruiter.ts** | Recruiter CRUD: jobs (`POST/PATCH`, AI `generate-description`, `…/optimize`, `…/auto-shortlist`); **`GET /api/recruiter/candidates`** (`useRecruiterCandidatesSearch`), **`GET /api/recruiter/candidates/[id]`** (`useRecruiterCandidateDetail`); resume **`/download`** signed URL + **`/analyze`** (`useRecruiterResumeSignedUrl`, `useRecruiterResumeAnalyze`); **`POST /api/recruiter/skill-gap`**, **`POST /api/recruiter/salary-estimate`**; **`useMessages`** / **`useRecruiterMessages`** → **`GET /api/messages`**; **`useSendMessage`** → **`POST /api/messages`**; **`useRecruiterCompany`** (first row from array); **`useSaveCompany`** (invalidates company + user queries); **`useUploadCompanyLogo`** / **`useRemoveCompanyLogo`**; templates, alerts, top-candidates, push, instant-shortlist; **`useUpdateUser`** merges **`profile_strength`** from **`PATCH /api/user`** into caches; `PATCH /api/user/role` |
| **use-activity.ts** | `GET /api/activity-feed`, `GET /api/platform-stats` |
| **use-notifications.ts** | `GET/PATCH /api/notifications` |
| **use-opportunity-alerts.ts** | `GET/PATCH /api/opportunity-alerts`, `POST /api/opportunity-alerts/scan` |
| **use-streak.ts** | `GET/POST /api/streak` |
| **use-streak-rewards.ts** | `GET/POST /api/streak-rewards` |
| **use-daily-actions.ts** | `GET/PATCH /api/daily-actions` |
| **use-analytics.ts** | `GET /api/insights` |
| **use-career-coach.ts** | `GET /api/career-coach` |
| **use-resume-performance.ts** | `GET /api/resume-performance`, `POST /api/share-result` (benchmark share) |
| **use-skill-demand.ts** | `GET /api/skill-demand` |

**Note:** Prefer **`hooks/mutations/*`** and query-module mutations in **`use-auto-apply.ts`** / **`use-recruiter.ts`** over ad-hoc `fetch` for shared invalidation; file uploads still use multipart helpers.

### 6.4 TanStack Query mutations (`hooks/mutations/`)

**Barrel:** **`hooks/mutations/index.ts`** re-exports the hooks below for convenient imports.

| File | Role |
|------|------|
| **use-upload-resume.ts** | `useUploadResume()` → **POST /api/upload-resume** (multipart). Invalidates `jobBoardKeys.resumes()` + `dashboardKeys.stats`. **`ResumeUpload`**, **`TailorResumeForm`**, **`JobFinderForm`**, **`LinkedInImportForm`**. |
| **use-analyze-resume.ts** | `useAnalyzeResume()` → **POST /api/analyze-resume**. **`/resume-analyzer`** (initial analyze + re-check improved resume). |
| **use-improve-resume.ts** | `useImproveResume()` → **POST /api/improve-resume**. **`/resume-analyzer`**, **`TailorResumeForm`**. |
| **use-import-linkedin.ts** | `useImportLinkedIn()` → **POST /api/import-linkedin**. **`LinkedInImportForm`**. |
| **use-auto-jobs.ts** | `useAutoJobsSearch()` → **POST /api/auto-jobs**. **`JobFinderForm`**. |
| **use-job-match.ts** | `useJobMatch()` → **POST /api/job-match**. **`JobMatchForm`**. |
| **use-generate-cover-letter.ts** | `useGenerateCoverLetter()` → **POST /api/generate-cover-letter**. **`CoverLetterForm`**, **`/job-board`**. |
| **use-cover-letter-crud.ts** | `useCoverLetterContent` (GET), `usePatchCoverLetter` (PATCH), `useDeleteCoverLetter` (DELETE) for **`/api/cover-letters/[id]`**. Invalidates **`dashboardKeys.history`**. **`HistoryCoverLetterSection`**, **`CoverLetterResult`**. |
| **use-salary-intelligence.ts** | `useSalaryIntelligenceSearch()` → **GET /api/salary-intelligence**. **`/salary-insights`**. |
| **use-interview-prep.ts** | `useInterviewPrep()` → **POST /api/interview-prep**. **`/interview-prep`**. |
| **use-dev-plan.ts** | `useDevPlanPatch()` → **PATCH /api/dev/plan** (local dev). **`DevPlanSwitcher`**. |
| **use-feedback.ts** | `useSubmitFeedback()` → **POST /api/feedback**. **`FeedbackButtons`**. |
| **use-public-landing.ts** | `usePublicExtractResume()` (multipart **POST /api/public/extract-resume**), `usePublicFresherResume()` (**POST /api/public/fresher-resume**). Landing hero / fresher flow. |

Rows above through **use-generate-cover-letter** call **`dispatchUsageUpdated`** and invalidate **`dashboardKeys.stats`** + **`dashboardKeys.history`** where the API records usage or history (upload invalidates stats + resume list only). Cover-letter CRUD only touches **`dashboardKeys.history`**.

---

## 7. Types

- **types/resume.ts:** Resume, ATSAnalysisResult (atsScore, missingSkills, resumeImprovements, recommendedRoles).
- **types/analysis.ts:** ImprovedResumeContent (summary, skills, experience, projects, education), InterviewPrepResponse.
- **types/jobMatch.ts:** JobMatchResult, JobMatchRecord.
- **types/jobFinder.ts:** ExtractedSkills, JobResult, JobSearchRecord.
- **types/autoApply.ts:** AutoApplyConfig, AutoApplyJobResult (includes interview_probability), AutoApplyRun, InterviewProbability, SmartApplyRules, SmartApplyRule.
- **types/structuredResume.ts:** StructuredResume, StructuredExperience, StructuredProject, StructuredEducation.
- **types/application.ts:** Application, ApplicationStatus, STATUS_LABELS, STATUS_COLORS.
- **types/recruiter.ts:** Company, JobPosting, JobApplication, AIScreening, **Message** (**read_at**, optional attachment metadata + API **`attachment_url`**), MessageTemplate, ApplicationStage, STAGE_LABELS, STAGE_COLORS, WorkType, EmploymentType, WORK_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS.
- **types/messages.ts:** **`PeerProfile`**, **`MessagesListResponse`** (`messages` + **`peer_profiles`**) for **`GET /api/messages`**.

---

## 8. Environment and config

- **.env.local:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY, OPENAI_API_KEY (optional fallback), ADZUNA_APP_ID + ADZUNA_APP_KEY (optional, for real job search in Auto Job Finder), CRON_SECRET (required in production for smart-apply trigger). See `.env.local.example` for full list.
- **supabase/grants.sql:** Run after migrations so anon/authenticated have GRANT on all app tables and sequences. Keep in sync when new tables are added (now includes activity_feed, platform_stats, recruiter_pushes, hiring_outcomes, salary_data, skill_demand).
- **next.config.ts:** Security headers (X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS, Referrer-Policy, Permissions-Policy). `serverExternalPackages` for pdf-parse and mammoth.
- **CI/CD:** `.github/workflows/ci.yml` — runs lint, type check (`tsc --noEmit`), and build on push/PR to main.
- **DB Triggers:** `updated_at` auto-update triggers on applications, auto_apply_runs, job_postings, job_applications, companies tables.
- **Supabase Realtime:** Enabled on **`notifications`** for **NotificationBell**; **`public.messages`** must be in the Realtime publication (Dashboard → Database → Replication) or **`postgres_changes`** never fires and the inbox/thread will not live-update. **`useMessages`** subscribes with **`sender_id` / `receiver_id`** filters; **`useThreadMessages`** adds a per-open-thread channel (**`messages-thread:{uid}:{peerId}`**) and a **~12s `refetchInterval`** fallback while a thread is open. Typing uses **broadcast** on **`typing:{sorted peer ids}`**.
- **Cron:** `POST /api/smart-apply/trigger` runs smart apply, daily reports, platform stats, skill demand, recruiter auto-push, opportunity scans, **rate_limit log cleanup**, and **expired AI cache cleanup**. Protected by `Authorization: Bearer CRON_SECRET` in production. Recommended: daily at midnight (Vercel / Railway / GitHub Actions).

---

## 9. Phase 9 — UX Overhaul (2026-03-20)

### 9.1 Authentication Changes

| Change | Details |
|--------|---------|
| **Google OAuth** | Added to both `/signup` and `/login` pages via `supabase.auth.signInWithOAuth({ provider: "google" })`. Redirects through `/auth/callback`. |
| **Role selection on signup** | Signup page now shows Job Seeker / Recruiter toggle. Selected role is passed as `?role=` query param to `/auth/callback`, which sets it in the users table. Default: `job_seeker`. |
| **Trust signals** | Both auth pages show trust badges below the form: "3.2x more interviews", "10,000+ users", "Secure & private". |
| **Auth callback role handling** | `/auth/callback/route.ts` now reads `?role=` param and updates `users.role` on first login. |

### 9.2 Onboarding Flow

New page: `app/(dashboard)/onboarding/page.tsx` — 3-step guided experience:
1. **Upload Resume** — File upload or paste text, triggers `/api/analyze-resume`
2. **See Your Score** — Shows ATS score with missing skills and improvements
3. **Start Applying** — Action cards: Find Jobs, Auto-Apply, Improve Resume, then Go to Dashboard

Added to middleware protected routes. New users redirected to `/onboarding` after signup.

### 9.3 Sidebar (`components/layout/Sidebar.tsx`)

Navigation groups (see file for exact order and icons):
- **Start here:** Dashboard, Quick Resume Builder, Resume Analyzer, Job Match, AI Auto-Apply
- **Explore more:** Job Board, Auto Job Finder, Smart Auto-Apply, Resume Tailoring, Cover Letter, Interview Prep, AI Career Coach
- **Advanced:** LinkedIn Import
- **Track & insights:** Applications, **Messages** (`/messages`), Career Analytics, Resume Performance, Activity Feed, Salary Insights, Skill Demand, Streak Rewards
- **(no group label):** History, Pricing, Settings
- Footer: **Switch to Recruiter** (when applicable)

### 9.4 Landing Page Changes

- **Converted to client component** (`"use client"`) for interactive tab switching
- **Job Seeker / Recruiter tabs** at the top toggle all landing page content dynamically
- **Navbar** has "For Recruiters" / "For Job Seekers" links that switch tabs, plus Jobs, Pricing, Login, Get Started Free
- **Job Seeker tab**: hero "Get 3x More Interviews — Without Applying Manually", social proof (3.2x/89%/50K+/₹0), 3-step Upload→Score→Apply, value section "See Exactly Why You're Not Getting Interviews" with interview probability card (78%), separate JS pricing (Free ₹0 / Pro ₹299 / Premium ₹499), streak rewards (7/14/30 days), final CTA "Stop Applying. Start Getting Interviews."
- **Recruiter tab**: hero "Hire Top 10 Candidates in 5 Seconds", social proof (5sec/92%/3x/₹0), 3-step Post→Shortlist→Hire, value section "Everything You Need to Hire Faster" with candidate preview card (94% match), separate recruiter pricing (Free ₹0 / Pro ₹299 / Premium ₹499), final CTA "Stop Screening. Start Hiring."
- All CTAs link to `/signup?role=${activeTab}` — role carries through to signup
- Shared sections: career intelligence links (Skills, Salary, Jobs), footer

### 9.4.1 Signup Role Pre-selection

- `app/signup/page.tsx` reads `?role=` from URL query params via `useSearchParams()`
- Pre-selects Job Seeker or Recruiter toggle based on the `role` param from landing page CTAs
- Component split: `SignupForm` (inner, uses `useSearchParams`) wrapped in `Suspense` by `SignupPage` (default export)
- Fallback: defaults to `job_seeker` if no role param or invalid value

### 9.5 New Components

| Component | Path | Purpose |
|-----------|------|---------|
| `EmptyState` | `components/ui/EmptyState.tsx` | Reusable empty state with icon, title, description, action button |
| `UpgradeBanner` | `components/ui/UpgradeBanner.tsx` | Smart upgrade prompt showing when usage is low/exhausted |
| `FeedbackButtons` | `components/ui/FeedbackButtons.tsx` | Thumbs up/down feedback on AI results, posts to `/api/feedback` |
| `ShareScoreButton` | `components/ui/ShareScoreButton.tsx` | Share ATS/match/interview scores via native share or clipboard |
| `SuccessAnimation` | `components/ui/SuccessAnimation.tsx` | Full-screen success overlay with check icon animation |

### 9.6 New API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/feedback` | POST | Stores user feedback (thumbs up/down) for AI features. Fields: `feature`, `resultId`, `type`. Best-effort insert to `feedback` table. |

### 9.7 Demo Mode

New public page: `app/demo/page.tsx` — accessible without authentication.
- Users paste resume text
- Client-side analysis generates plausible ATS score (no API call)
- Full results are blurred/locked behind signup CTA
- Converts curiosity into signups

### 9.8 Notification copy (auto-apply confirm)

- Auto-Apply confirm notification: **title** includes count (e.g. `N new application(s) sent!`); **message** includes `Your next interview could be around the corner!` (see `app/api/auto-apply/[id]/confirm/route.ts`).
- Smart Apply and daily report copy remain in their respective notification creators in `lib/smartApplyEngine.ts` / `lib/dailyReport.ts`.

### 9.9 Smart Upgrade Triggers

- Resume Analyzer page shows `UpgradeBanner` when usage approaches or hits free limit
- API returns `_usage: { used, limit }` in response so frontend can track
- Banner appears in two states: amber (1 remaining) or red (0 remaining)

### 9.10 Feedback & Share System

- **FeedbackButtons** added to: ResumeAnalysisResult, MatchResult, CoverLetterResult
- **ShareScoreButton** added to: ResumeAnalysisResult (ATS score), MatchResult (match score)
- Uses native `navigator.share()` on mobile, clipboard copy on desktop

### 9.11 Empty State Improvements

- **ActivityList** empty state now shows 3 actionable cards (Analyze Resume, Find Jobs, Generate Cover Letter) instead of plain text
- Uses `EmptyState` component pattern for consistent empty states across pages

### 9.12 QA Cross-Verification Fixes (Phase 9.1)

| Bug ID | Severity | File(s) | Issue | Fix |
|--------|----------|---------|-------|-----|
| BUG-A | CRITICAL | signup, login | Google OAuth error "provider is not enabled" — raw Supabase error shown to user | Added user-friendly error message: "Google sign-in is not configured yet. Please use email signup instead." **Root cause is Supabase Dashboard config** — Google provider must be enabled in Authentication → Providers with OAuth Client ID/Secret. |
| BUG-B | MEDIUM | signup | `next` param in OAuth `redirectTo` URL not `encodeURIComponent()`-wrapped | Added `encodeURIComponent()` for `next` param in both OAuth and email redirect URLs. Login page already had this. |
| BUG-E | LOW | ShareScoreButton | `nativeShare()` used `if (navigator.share)` while outer code used `typeof` check | Unified to `typeof navigator !== "undefined" && typeof navigator.share === "function"` in both locations. |
| BUG-F | LOW | SuccessAnimation | `onDone` callback in useEffect dependency array causes infinite re-render when passed inline | Used `useRef` pattern (`onDoneRef`) to capture latest callback without dependency. |
| BUG-G | LOW | onboarding | File upload accepts `.pdf/.doc/.docx` but `file.text()` only reads plain text correctly | Changed accept to `.txt` only, updated label. Full PDF/DOC parsing handled by `ResumeUpload` component on resume-analyzer page. |

---

## 10. Updating this document

- When you add or remove API routes, pages, or lib functions: update the corresponding section (§5, §6, §4).
- When you change schema, RLS, or migrations: update §3 and note any new migration or grant step.
- When you change auth or middleware behavior: update §2.
- When you change types or env: update §7, §8.
- Keep **Last updated** at the top in sync with significant changes.

**Cursor:** The project rule `.cursor/rules/update-kt-on-changes.mdc` instructs the AI to update this doc when making code changes; follow the same practice when editing by hand.
