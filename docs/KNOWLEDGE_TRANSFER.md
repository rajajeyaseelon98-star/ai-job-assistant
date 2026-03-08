# AI Job Assistant – Knowledge Transfer Document

**Purpose:** Single source of truth for how the app works. Update this doc whenever you change routes, APIs, components, lib, or database.

**Last updated:** 2025-03-07 (align with significant code changes).

---

## 1. Project overview

- **Stack:** Next.js 15 (App Router), React 18, TypeScript, Supabase (Auth + Postgres), Tailwind CSS.
- **AI:** Gemini (primary) and OpenAI (fallback on 429/quota). See `lib/ai.ts`.
- **Main flows:** Resume upload & ATS analysis, resume improve (Pro), job match, cover letter, interview prep. Usage is tracked per feature; free plan has limits.

---

## 2. Entry and auth

### 2.1 Middleware (`middleware.ts`)

- Runs on every request (except static assets). Calls `updateSession()` from `lib/supabase/middleware.ts` to refresh Supabase session cookies.
- **Protected paths:** `/dashboard`, `/resume-analyzer`, `/job-match`, `/cover-letter`, `/interview-prep`, `/history`, `/pricing`, `/settings`, and all `/api/*` except `/api/auth`.
- **Behavior:** If unauthenticated on a protected path: API → 401 JSON; page → redirect to `/login?next=<path>`. If authenticated but email not confirmed (`!user.email_confirmed_at`) on a page → redirect to `/login?error=verify`.

### 2.2 Auth callback (`app/auth/callback/route.ts`)

- GET: reads `code` and `next` from query. Exchanges `code` for session via `supabase.auth.exchangeCodeForSession`, calls `ensureUserRow(userId, email)`, then redirects to `origin + sanitizeRedirectPath(next)` (or `/login?error=auth` on failure).
- `sanitizeRedirectPath`: allows only paths starting with `/`, no `//` or `://` (open-redirect safe).

### 2.3 Auth lib (`lib/auth.ts`)

- **getUser():** Gets Supabase auth user; loads profile from `public.users` (id, email, name, created_at, plan_type). If no profile, calls `ensureUserRow` then re-selects.
- **ensureUserRow(userId, email):** Upserts into `public.users` with `plan_type: "free"`, `onConflict: "id", ignoreDuplicates: true` so existing rows (e.g. plan_type) are not overwritten.

---

## 3. Database (Supabase Postgres)

**Schema reference:** `supabase/schema.sql`. Migrations in `supabase/migrations/`. After applying migrations, run `supabase/grants.sql` (or the GRANT section in schema) so `anon` and `authenticated` have table access; otherwise "permission denied for table" occurs.

| Table | Purpose |
|-------|--------|
| **users** | Profile per auth user: id (FK auth.users), email, name, plan_type (free/pro/premium). Synced by trigger `on_auth_user_created` → `handle_new_user()`; app uses `ensureUserRow` as backup. |
| **resumes** | Uploaded resumes: user_id, file_url, parsed_text, created_at. |
| **resume_analysis** | ATS analysis per resume: resume_id (FK resumes), score (0–100), analysis_json, created_at. **No user_id**; access via RLS through resumes.user_id. |
| **improved_resumes** | AI-improved resume content: user_id, optional resume_id, improved_content (JSONB), job_title, job_description, created_at. RLS: auth.uid() = user_id. |
| **job_matches** | Job match results: user_id, optional resume_id, job_description, job_title, resume_text, match_score, missing_skills, analysis (JSONB). |
| **cover_letters** | Generated cover letters: user_id, company_name, job_title, job_description, content, resume_text. |
| **interview_sessions** | Interview prep: user_id, role, experience_level, content_json. |
| **usage_logs** | Per-user, per-feature usage for limits: user_id, feature, timestamp. |
| **user_preferences** | career preferences (experience_level, preferred_role, etc.). |
| **subscriptions** | Billing (stripe/razorpay ids, plan_type, status, current_period_end). |

**RLS:** All tables have RLS; policies scope by `auth.uid()` (own user or own related row). `resume_analysis` uses `EXISTS (resumes.id = resume_analysis.resume_id AND resumes.user_id = auth.uid())`.

---

## 4. Lib layer (server-side)

| File | Role |
|------|------|
| **lib/supabase/server.ts** | `createClient()` for server: uses Next `cookies()` (getAll/setAll). Used in Server Components and API routes. |
| **lib/supabase/middleware.ts** | `updateSession(request)`: creates Supabase client with request/response cookies, calls `getUser()` to refresh session, returns NextResponse. |
| **lib/supabase/client.ts** | Browser Supabase client (if used). |
| **lib/auth.ts** | See §2.3. |
| **lib/ai.ts** | `aiGenerate(systemPrompt, userContent, { jsonMode? })`, `aiGenerateContent(prompt)`. Prefers Gemini; on 429/quota/rate-limit error falls back to OpenAI if `OPENAI_API_KEY` set. |
| **lib/gemini.ts** | `isGeminiAvailable()`, `geminiGenerate`, `geminiGenerateContent`. Model: gemini-2.5-flash. Requires `GEMINI_API_KEY`. |
| **lib/openai.ts** | `isOpenAIAvailable()`, `chatCompletion(system, user, { jsonMode? })`. Model: gpt-4o-mini. Requires `OPENAI_API_KEY`. |
| **lib/usage.ts** | `getUsageCount(userId, feature)`, `canUseFeature(userId, feature, planType)`, `logUsage(userId, feature)`, `getUsageSummary(userId, planType)`. Free limits: resume_analysis 3, job_match 3, cover_letter 1, interview_prep 0, resume_improve 0 (Pro only). |
| **lib/rateLimit.ts** | In-memory: 10 requests per minute per user. `checkRateLimit(userId)` → `{ allowed, retryAfterMs }`. Resets on restart. |
| **lib/validation.ts** | `isValidUUID(id)`, `sanitizeRedirectPath(path, fallback)`, `escapeHtml(str)`. |
| **lib/buildDocx.ts** | `buildImprovedResumeDocx(content: ImprovedResumeContent)` → Buffer (DOCX). Used by download and export-docx APIs. |

---

## 5. API routes (behavior and data flow)

All protected APIs use `getUser()`; 401 if no user. Many use `checkRateLimit(user.id)` and return 429 when not allowed. Feature-gated routes use `canUseFeature` and `logUsage`.

| Route | Method | Purpose |
|-------|--------|--------|
| **/api/analyze-resume** | POST | Body: resumeText, resumeId?, recheckAfterImprovement?, previousAnalysis?. Validates; checks rate limit and resume_analysis feature; calls AI (RECHECK_PROMPT if recheck); inserts resume_analysis if resumeId; logs usage; returns ATSAnalysisResult. |
| **/api/upload-resume** | POST | Multipart: file (PDF/DOCX, max 5MB). Parses text (pdfParser/docxParser), uploads to storage, inserts resumes row; returns { id, parsed_text }. |
| **/api/resume-analysis/[id]** | GET | Validates UUID; fetches resume_analysis by id (no user_id filter; RLS applies). Optionally loads resume parsed_text. Returns analysis + resume_text, resume_id. |
| **/api/improve-resume** | POST | Body: resumeText, resumeId?, jobTitle?, jobDescription?, previousAnalysis?. Pro-only (canUseFeature resume_improve). AI returns ImprovedResumeContent; inserts improved_resumes (user_id, resume_id if any, job_title, job_description); returns { ...content, improvedResumeId }. |
| **/api/improved-resumes/[id]** | GET | Fetches improved_resumes by id and user_id. Returns id, improved_content, job_title, created_at. |
| **/api/improved-resumes/[id]/download** | GET | Query: format=docx. Fetches row by id and user_id; builds DOCX via buildImprovedResumeDocx; returns file. |
| **/api/improved-resumes/export-docx** | POST | Body: { content: ImprovedResumeContent }. Auth only. Builds DOCX from content (no DB row); returns file. Used when client has content but no saved id. |
| **/api/job-match** | POST | Body: resumeText, resumeId?, jobDescription, jobTitle?. Usage job_match; AI match; inserts job_matches (user_id, resume_id?, job_description, job_title, resume_text, match_score, analysis); logs usage; returns match result. |
| **/api/job-matches/[id]** | GET | Fetches job_matches by id and user_id. |
| **/api/generate-cover-letter** | POST | Body: companyName, jobTitle, jobDescription, resumeText, etc. Usage cover_letter; AI; inserts cover_letters; logs after save; returns content. |
| **/api/cover-letters** | GET | List cover_letters for user. |
| **/api/cover-letters/[id]** | GET, PATCH, DELETE | Single cover letter by id and user_id. |
| **/api/interview-prep** | POST | Body: role, experienceLevel, resumeText?. Usage interview_prep; AI; inserts interview_sessions; returns content_json. |
| **/api/usage** | GET | Returns getUsageSummary for current user. |
| **/api/user** | GET | Current user profile. PATCH: update name/preferences (validated/sanitized). |
| **/api/user/delete-account** | POST | Deletes related data (resumes, resume_analysis, improved_resumes, job_matches, cover_letters, usage_logs, etc.) then auth user. |
| **/api/dev/plan** | PATCH | Dev only (NODE_ENV === development). Body: planType (free|pro|premium). Updates users.plan_type for current user. |

---

## 6. Pages and main components

| Page | Path | Behavior |
|------|------|----------|
| Landing | `/` | app/page.tsx – links to login/signup. |
| Login | `/login` | Login form; redirect `next` sanitized. |
| Signup | `/signup` | Sign up. |
| Reset | `/login/reset` | Password reset. |
| Dashboard | `/dashboard` | Server: getUser, getUsageSummary, recent resume_analysis (no user_id filter), job_matches, cover_letters by user_id; activity list sorted by date; ScoreCard, JobMatchAvgCard, UsageCard, QuickActions, ActivityList. |
| Resume Analyzer | `/resume-analyzer` | Client: upload, paste text, analyze, improve (optional job/analysis context). Query params: analysisId, improvedId (load past analysis or improved resume). State: improvedResumeId passed to ImprovedResumeView for DOCX download. Re-analyze improved resume uses analysisForRecheck snapshot. |
| Job Match | `/job-match` | JobMatchForm; calls /api/job-match; MatchResult. |
| Cover Letter | `/cover-letter` | CoverLetterForm; generate; CoverLetterResult. |
| Interview Prep | `/interview-prep` | Form (role, level, resume); InterviewQuestions. |
| History | `/history` | Server: lists resume_analysis, job_matches, improved_resumes, cover_letters (each by user_id; resume_analysis has no user_id column – RLS only). HistoryImprovedResumeSection receives loadError from query; shows error or empty hint. |
| Pricing | `/pricing` | Client: plan comparison; Upgrade buttons (alert for now). |
| Settings | `/settings` | SettingsForm; DevPlanSwitcher (dev only) to toggle plan_type. |

### 6.1 Key components

- **ImprovedResumeView:** Props: content, improvedResumeId?. Copy: improvedToPlainText → clipboard with "Copied!" / error feedback. PDF: iframe with srcdoc HTML → print() then remove iframe on afterprint (no blob URL in address bar). DOCX: if improvedResumeId → open GET download URL; else POST /api/improved-resumes/export-docx with content and trigger download. Uses esc() for HTML in print view (XSS-safe).
- **ResumeUpload, ResumeAnalysisResult, JobMatchForm, MatchResult, CoverLetterForm, CoverLetterResult, InterviewQuestions:** Form + result per feature.
- **Dashboard:** ScoreCard, JobMatchAvgCard, UsageCard, QuickActions, ActivityList.
- **Layout:** DashboardLayout, Sidebar (nav + mobile hamburger), Topbar (usage refresh).

---

## 7. Types

- **types/resume.ts:** Resume, ATSAnalysisResult (atsScore, missingSkills, resumeImprovements, recommendedRoles).
- **types/analysis.ts:** ImprovedResumeContent (summary, skills, experience, projects, education), InterviewPrepResponse.
- **types/jobMatch.ts:** JobMatchResult, JobMatchRecord.

---

## 8. Environment and config

- **.env.local:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY, OPENAI_API_KEY (optional fallback).
- **supabase/grants.sql:** Run after migrations so anon/authenticated have GRANT on all app tables and sequences.

---

## 9. Updating this document

- When you add or remove API routes, pages, or lib functions: update the corresponding section (§5, §6, §4).
- When you change schema, RLS, or migrations: update §3 and note any new migration or grant step.
- When you change auth or middleware behavior: update §2.
- When you change types or env: update §7, §8.
- Keep **Last updated** at the top in sync with significant changes.

**Cursor:** The project rule `.cursor/rules/update-kt-on-changes.mdc` instructs the AI to update this doc when making code changes; follow the same practice when editing by hand.
