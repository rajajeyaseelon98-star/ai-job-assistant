# AI Job Assistant – Knowledge Transfer Document

**Purpose:** Single source of truth for how the app works. Update this doc whenever you change routes, APIs, components, lib, or database.

**Last updated:** 2026-03-20 (Phase 9 — UX Overhaul: Google OAuth, onboarding flow, role selection on signup, sidebar grouping, demo mode, feedback system, smart upgrade triggers, improved notifications, share/viral loop, empty state guidance, landing page Job Seeker/Recruiter tabs, signup role pre-selection from query params).

---

## 1. Project overview

- **Stack:** Next.js 15 (App Router), React 18, TypeScript, Supabase (Auth + Postgres), Tailwind CSS.
- **AI:** Gemini (primary) and OpenAI (fallback on 429/quota). See `lib/ai.ts`. Cached wrappers (`cachedAiGenerate`, `cachedAiGenerateContent`) in `lib/ai.ts` check `ai_cache` table before calling AI, reducing costs 30-50%.
- **Main flows:** Resume upload & ATS analysis, resume improve (Pro), job match, cover letter, interview prep, **auto job finder**, **AI auto-apply** (killer feature), **smart auto-apply** (set & forget), **resume tailoring**, **application tracker**, **LinkedIn import**. Usage is tracked per feature; free plan has limits.
- **AI Auto-Apply:** User selects resume → system finds jobs (Adzuna + internal) → pre-filter scores with JS (no AI) → deep AI match top N → **interview probability score** computed per job → user reviews & confirms → applications created. Assisted mode.
- **Smart Auto-Apply:** Pro feature. User sets rules once (min match score, salary range, roles, locations, daily/weekly limits) → system runs daily via cron → auto-applies to qualifying jobs → user notified. `/api/smart-apply/trigger` endpoint for cron.
- **Interview Probability Score:** JS-only (no AI cost). Factors: skill overlap, experience alignment, ATS quality, historical success rate. **Weights are dynamically adjusted** by the Learning Engine based on application outcomes. Returns HIGH/MEDIUM/LOW with reasons and boost tips.
- **Learning Engine:** Tracks applications → interviews → offers/rejections. Extracts insights: best-performing skills, worst-performing roles, conversion rates, response times. Adjusts scoring weights dynamically (e.g., boosts skill weight if user gets interviews with high skill overlap).
- **Career Analytics:** Conversion funnel (Saved→Applied→Interview→Offer), AI recommendations, performance metrics. Available at `/analytics`.
- **Daily AI Reports:** Auto-generated notifications summarizing daily activity (jobs found, applied, interviews, responses). Sent via cron alongside smart-apply trigger.
- **Activity Feed:** Personal and public activity tracking. Logs application submissions, resume improvements, milestones (10/25/50/100/250/500 applications). Public milestones visible in community feed. Social proof.
- **Platform Social Proof:** Aggregated platform stats (total users, applications, interviews, hires, avg match score). Cached in `platform_stats` table, refreshed via cron. Displayed on activity feed page.
- **Role system:** Users have a `role` field (`job_seeker` or `recruiter`). Role selection at `/select-role`. Switching via `/api/user/role` PATCH. Route groups: `(dashboard)` for job seekers, `(recruiter)` for recruiters.
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

---

## 2. Entry and auth

### 2.1 Middleware (`middleware.ts`)

- Runs on every request (except static assets). Calls `updateSession()` from `lib/supabase/middleware.ts` to refresh Supabase session cookies.
- **Protected paths:** `/dashboard`, `/resume-analyzer`, `/job-match`, `/job-board`, `/job-finder`, `/auto-apply`, `/smart-apply`, `/tailor-resume`, `/cover-letter`, `/interview-prep`, `/import-linkedin`, `/applications`, `/analytics`, `/activity`, `/salary-insights`, `/skill-demand`, `/resume-performance`, `/career-coach`, `/streak-rewards`, `/select-role`, `/recruiter`, `/history`, `/pricing`, `/settings`, and all `/api/*` except `/api/auth`. **Public paths:** `/share/[token]` (shareable score card), `/u/[slug]` (public profile), `/results/[token]` (shareable results), `/jobs` and `/jobs/[slug]` (SEO job pages), `/salary/[slug]` and `/salary` (SEO salary pages), `/skills` (SEO skills page), `/api/platform-stats` (social proof).
- **Behavior:** If unauthenticated on a protected path: API → 401 JSON; page → redirect to `/login?next=<path>`. If authenticated but email not confirmed (`!user.email_confirmed_at`) on a page → redirect to `/login?error=verify`.

### 2.2 Auth callback (`app/auth/callback/route.ts`)

- GET: reads `code` and `next` from query. Exchanges `code` for session via `supabase.auth.exchangeCodeForSession`, calls `ensureUserRow(userId, email)`, then redirects to `origin + sanitizeRedirectPath(next)` (or `/login?error=auth` on failure).
- `sanitizeRedirectPath`: allows only paths starting with `/`, no `//` or `://` (open-redirect safe).

### 2.3 Auth lib (`lib/auth.ts`)

- **getUser():** Gets Supabase auth user; loads profile from `public.users` (id, email, name, created_at, plan_type, role). If no profile, calls `ensureUserRow` then re-selects.
- **ensureUserRow(userId, email):** Upserts into `public.users` with `plan_type: "free"`, `role: "job_seeker"`, `onConflict: "id", ignoreDuplicates: true` so existing rows are not overwritten.
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
| **messages** | Messages between recruiters and candidates: sender_id, receiver_id, job_id?, subject, content, is_read, template_name. |
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

**RLS:** All tables have RLS; policies scope by `auth.uid()` (own user or own related row). `resume_analysis` uses `EXISTS (resumes.id = resume_analysis.resume_id AND resumes.user_id = auth.uid())`. Recruiter tables: recruiters manage own rows; candidates can view/insert their own applications; anyone can view active job_postings and companies. Platform stats, salary data, skill demand are publicly readable.

---

## 4. Lib layer (server-side)

| File | Role |
|------|------|
| **lib/supabase/server.ts** | `createClient()` for server: uses Next `cookies()` (getAll/setAll). Used in Server Components and API routes. |
| **lib/supabase/middleware.ts** | `updateSession(request)`: creates Supabase client with request/response cookies, calls `getUser()` to refresh session, returns NextResponse. |
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
| **lib/notifications.ts** | `createNotification(userId, type, title, message, data?)` — inserts into notifications table. Non-critical, silently ignores errors. |
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
| **lib/usage.ts** | `getUsageCount(userId, feature)`, `canUseFeature(userId, feature, planType)`, `logUsage(userId, feature)`, `getUsageSummary(userId, planType)` — single-query optimization (1 DB call instead of 8). Free limits: resume_analysis 3, job_match 3, cover_letter 1, interview_prep 0, resume_improve 0 (Pro only), job_finder 1, auto_apply 2, smart_apply 0 (Pro only). |
| **lib/rateLimit.ts** | DB-backed rate limiter (serverless-safe): 10 requests per minute per user. `await checkRateLimit(userId)` → `{ allowed, retryAfterMs }`. Uses `usage_logs` table with `rate_limit` feature. Fail-open on DB errors. |
| **lib/validation.ts** | `isValidUUID(id)`, `sanitizeRedirectPath(path, fallback)`, `escapeHtml(str)`. |
| **lib/buildDocx.ts** | `buildImprovedResumeDocx(content: ImprovedResumeContent)` → Buffer (DOCX). Used by download and export-docx APIs. Includes "Created with AI Job Assistant" watermark footer. |

---

## 5. API routes (behavior and data flow)

All protected APIs use `getUser()`; 401 if no user. Many use `checkRateLimit(user.id)` and return 429 when not allowed. Feature-gated routes use `canUseFeature` and `logUsage`.

| Route | Method | Purpose |
|-------|--------|--------|
| **/api/analyze-resume** | POST | Body: resumeText, resumeId?, recheckAfterImprovement?, previousAnalysis?. Validates; checks rate limit and resume_analysis feature; calls AI (RECHECK_PROMPT if recheck); inserts resume_analysis if resumeId; logs usage; returns ATSAnalysisResult. |
| **/api/upload-resume** | POST | Multipart: file (PDF/DOCX, max 5MB). Parses text (pdfParser/docxParser), uploads to storage, inserts resumes row with storage path (not signed URL); returns { id, parsed_text }. |
| **/api/resume-file/[id]** | GET | On-demand signed URL generation (15-min expiry) for downloading resume files. Verifies ownership. Backward-compatible with legacy full URLs. |
| **/api/resume-analysis/[id]** | GET | Validates UUID; fetches resume_analysis by id (no user_id filter; RLS applies). Optionally loads resume parsed_text. Returns analysis + resume_text, resume_id. |
| **/api/improve-resume** | POST | Body: resumeText, resumeId?, jobTitle?, jobDescription?, previousAnalysis?. Pro-only (canUseFeature resume_improve). AI returns ImprovedResumeContent; inserts improved_resumes (user_id, resume_id if any, job_title, job_description); logs activity (resume_improved); returns { ...content, improvedResumeId }. |
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
| **/api/auto-jobs** | POST | Body: resumeText, location?. Extracts skills via AI, searches Adzuna API (if ADZUNA_APP_ID/ADZUNA_APP_KEY set) + generates AI job suggestions. Saves to job_searches. Usage: job_finder (free: 1/month). |
| **/api/auto-jobs/history** | GET | Lists past job searches for current user (max 20). |
| **/api/applications** | GET, POST | GET: list all applications for user. POST: create new application (company, role required; status, applied_date, url, salary, location, notes optional). Logs activity (application_submitted) and checks milestones. |
| **/api/applications/[id]** | GET, PATCH, DELETE | Single application by id and user_id. PATCH: partial update. DELETE: remove. |
| **/api/import-linkedin** | POST | Body: profileText (min 50 chars). AI parses LinkedIn profile text into ImprovedResumeContent JSON. |
| **/api/user/role** | PATCH | Body: { role }. Switches user role between job_seeker and recruiter. |
| **/api/jobs** | GET | Public: list active job postings with filters (search, location, work_type, employment_type, skills). Paginated. |
| **/api/jobs/[id]** | GET | Public: single active job posting with company info. |
| **/api/jobs/[id]/apply** | POST | Job seeker applies to a job. Body: { resume_id?, cover_letter? }. Increments application_count. |
| **/api/recruiter/company** | GET, POST | Recruiter company profiles CRUD. |
| **/api/recruiter/company/[id]** | GET, PATCH, DELETE | Single company profile. |
| **/api/recruiter/jobs** | GET, POST | List/create job postings. |
| **/api/recruiter/jobs/[id]** | GET, PATCH, DELETE | Single job posting CRUD. |
| **/api/recruiter/jobs/generate-description** | POST | AI-generated job description from title, skills, experience level, work type. |
| **/api/recruiter/jobs/[id]/optimize** | POST | AI analysis of job posting: suggestions, optimized title/description, score. |
| **/api/recruiter/jobs/[id]/auto-shortlist** | POST | AI auto-screen applied candidates, shortlist top matches. Returns shortlisted count. |
| **/api/recruiter/applications** | GET | List applications for recruiter's jobs with filters (job_id, stage). |
| **/api/recruiter/applications/[id]** | GET, PATCH, DELETE | Single application: update stage, notes, rating, interview_date. |
| **/api/recruiter/applications/[id]/screen** | POST | AI screening of candidate resume against job requirements. Saves ai_screening JSONB. |
| **/api/recruiter/applications/[id]/interview** | POST, PATCH, DELETE | Schedule/reschedule/cancel interview. Updates interview_date, interview_notes, stage. |
| **/api/recruiter/candidates** | GET | Search candidates with skills/experience/location filters. |
| **/api/recruiter/candidates/[id]** | GET | Detailed candidate profile with resumes and preferences. |
| **/api/recruiter/messages** | GET, POST | List messages (with unread filter) and send messages. |
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
| **/api/smart-apply/trigger** | POST | Unified cron endpoint: (1) run all smart apply rules, (2) send daily report notifications, (3) refresh platform stats, (4) refresh skill demand data, (5) recruiter auto-push, (6) scan opportunity alerts for recently active users. Protected by `CRON_SECRET` header in production. |
| **/api/profile** | GET, PATCH | GET: own public profile with badges, resume count, best ATS score. PATCH: update headline, bio, profile_visible. Auto-generates public slug on enable. Recalculates profile strength. |
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
| Landing | `/` | app/page.tsx — **client component** with Job Seeker / Recruiter tab toggle. Job Seeker: "Get 3x More Interviews" hero, Upload→Score→Apply flow, interview probability preview, streak rewards. Recruiter: "Top 10 Candidates In 5 Seconds" hero, Post→Shortlist→Hire flow, recruiter tools grid, candidate preview. All CTAs link to `/signup?role=${activeTab}`. Shared pricing + career intelligence. |
| Login | `/login` | Login form; redirect `next` sanitized. |
| Signup | `/signup` | Sign up. |
| Reset | `/login/reset` | Password reset. |
| Dashboard | `/dashboard` | Server: getUser, getUsageSummary, recent resume_analysis (no user_id filter), job_matches, cover_letters by user_id; activity list sorted by date. Client widgets: **StreakWidget** (daily login recording, streak level, XP, multiplier, progress to next reward), **OpportunityAlerts** (urgent opportunities with scan), **DailyActions** (personalized to-do items with completion tracking). ScoreCard, JobMatchAvgCard, UsageCard, QuickActions, ActivityList. |
| Resume Analyzer | `/resume-analyzer` | Client: upload, paste text, analyze, improve (optional job/analysis context). Query params: analysisId, improvedId (load past analysis or improved resume). State: improvedResumeId passed to ImprovedResumeView for DOCX download. Re-analyze improved resume uses analysisForRecheck snapshot. |
| Job Match | `/job-match` | JobMatchForm; calls /api/job-match; MatchResult. |
| Cover Letter | `/cover-letter` | CoverLetterForm; generate; CoverLetterResult. |
| Interview Prep | `/interview-prep` | Form (role, level, resume); InterviewQuestions. |
| History | `/history` | Server: lists resume_analysis, job_matches, improved_resumes, cover_letters (each by user_id; resume_analysis has no user_id column – RLS only). HistoryImprovedResumeSection receives loadError from query; shows error or empty hint. |
| Auto Job Finder | `/job-finder` | Client: upload/paste resume + optional location; calls /api/auto-jobs; shows SkillsOverview (extracted skills) + JobResults (job cards with apply links, source filter). |
| Resume Tailoring | `/tailor-resume` | Client: upload/paste resume + paste job description; calls existing /api/improve-resume with jobTitle + jobDescription; renders ImprovedResumeView with download options. |
| LinkedIn Import | `/import-linkedin` | Client: upload LinkedIn PDF or paste profile text; calls /api/import-linkedin; renders ImprovedResumeView. |
| Smart Auto-Apply | `/smart-apply` | Client: Pro feature. Configure rules (match score slider, salary range, roles, locations, remote toggle, daily/weekly limits). View active rules with stats (total applied, total runs). Toggle enable/disable. How-it-works section. |
| Applications | `/applications` | Client: CRUD application tracker with board (Kanban) and list views; stats row; status filter; inline status change. |
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
| Job Board | `/job-board` | Client: browse active recruiter-posted jobs with search/filters. Apply with resume selection and cover letter. |
| Role Select | `/select-role` | Choose job_seeker or recruiter role on first visit. |
| Settings | `/settings` | SettingsForm; DevPlanSwitcher (dev only) to toggle plan_type. |
| **Recruiter Dashboard** | `/recruiter` | Stats (active jobs, applications, unread messages), quick actions, recent applications. |
| Recruiter Jobs | `/recruiter/jobs` | Job listings with status filter, toggle active/paused, delete. |
| New Job | `/recruiter/jobs/new` | Create job with AI description generator. |
| Edit Job | `/recruiter/jobs/[id]` | Edit job details, status, delete. |
| Optimize Job | `/recruiter/jobs/[id]/optimize` | AI job post optimization with score and suggestions. |
| Auto-Shortlist | `/recruiter/jobs/[id]/auto-shortlist` | AI auto-screen unreviewed applications. |
| Candidates | `/recruiter/candidates` | Search candidate resume database with skills/experience/location filters. |
| Applications (ATS) | `/recruiter/applications` | ATS pipeline (Kanban + list view), AI screening, rating, stage management. |
| Messages | `/recruiter/messages` | Inbox and compose messages to candidates. |
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
| Recruiter Settings | `/recruiter/settings` | Display name, role switch. |

### 6.1 Key components

- **ImprovedResumeView:** Props: content, improvedResumeId?. Copy: improvedToPlainText → clipboard with "Copied!" / error feedback. PDF: iframe with srcdoc HTML → print() then remove iframe on afterprint (no blob URL in address bar). DOCX: if improvedResumeId → open GET download URL; else POST /api/improved-resumes/export-docx with content and trigger download. Uses esc() for HTML in print view (XSS-safe).
- **ResumeUpload, ResumeAnalysisResult, JobMatchForm, MatchResult, CoverLetterForm, CoverLetterResult, InterviewQuestions:** Form + result per feature.
- **Dashboard:** ScoreCard, JobMatchAvgCard, UsageCard, QuickActions, ActivityList, **StreakWidget** (flame icon, streak count, level badge, XP multiplier, streak freeze indicator, progress bar to next reward, stats row with best streak/active days/XP), **DailyActions** (personalized to-do checklist with completion progress bar, priority labels, action icons, "Go" links, 100% completion celebration), **OpportunityAlerts** (urgency-colored alert cards with dismiss, action links, auto-scan on load).
- **Layout:** DashboardLayout, Sidebar (nav + mobile hamburger), Topbar (usage refresh).
- **RecruiterLayout:** Server component in `(recruiter)/layout.tsx`; checks `role === 'recruiter'`, redirects to `/select-role` if not.
- **RecruiterSidebar:** Navigation for recruiter section with all recruiter pages + Instant Shortlist + Top Candidates + "Switch to Job Seeker" link.
- **RecruiterTopbar:** Simple topbar with user dropdown and NotificationBell.
- **NotificationBell:** Supabase Realtime subscription for instant notifications. Toast popup on new notification. Animated pulse badge for unread count. Falls back to 60s polling if Realtime unavailable. Used in RecruiterTopbar (can add to dashboard Topbar).
- **JobMatchCard:** Shows match score circle, interview probability badge (HIGH/MEDIUM/LOW), expandable interview chance panel with progress bar, reasons, and boost tips. Checkbox for apply selection.
- **AutoApplyForm/AutoApplyProgress/AutoApplyResults:** Config form, status display, and results with job selection and confirm flow.

---

## 7. Types

- **types/resume.ts:** Resume, ATSAnalysisResult (atsScore, missingSkills, resumeImprovements, recommendedRoles).
- **types/analysis.ts:** ImprovedResumeContent (summary, skills, experience, projects, education), InterviewPrepResponse.
- **types/jobMatch.ts:** JobMatchResult, JobMatchRecord.
- **types/jobFinder.ts:** ExtractedSkills, JobResult, JobSearchRecord.
- **types/autoApply.ts:** AutoApplyConfig, AutoApplyJobResult (includes interview_probability), AutoApplyRun, InterviewProbability, SmartApplyRules, SmartApplyRule.
- **types/structuredResume.ts:** StructuredResume, StructuredExperience, StructuredProject, StructuredEducation.
- **types/application.ts:** Application, ApplicationStatus, STATUS_LABELS, STATUS_COLORS.
- **types/recruiter.ts:** Company, JobPosting, JobApplication, AIScreening, Message, MessageTemplate, ApplicationStage, STAGE_LABELS, STAGE_COLORS, WorkType, EmploymentType, WORK_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS.

---

## 8. Environment and config

- **.env.local:** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY, OPENAI_API_KEY (optional fallback), ADZUNA_APP_ID + ADZUNA_APP_KEY (optional, for real job search in Auto Job Finder), CRON_SECRET (required in production for smart-apply trigger). See `.env.local.example` for full list.
- **supabase/grants.sql:** Run after migrations so anon/authenticated have GRANT on all app tables and sequences. Keep in sync when new tables are added (now includes activity_feed, platform_stats, recruiter_pushes, hiring_outcomes, salary_data, skill_demand).
- **next.config.ts:** Security headers (X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS, Referrer-Policy, Permissions-Policy). `serverExternalPackages` for pdf-parse and mammoth.
- **CI/CD:** `.github/workflows/ci.yml` — runs lint, type check (`tsc --noEmit`), and build on push/PR to main.
- **DB Triggers:** `updated_at` auto-update triggers on applications, auto_apply_runs, job_postings, job_applications, companies tables.
- **Supabase Realtime:** Enabled on `notifications` table for instant notification delivery to the NotificationBell component. Must enable Realtime replication for the `notifications` table in Supabase Dashboard → Database → Replication.
- **Cron:** Single cron endpoint `POST /api/smart-apply/trigger` handles: (1) Smart Auto-Apply execution, (2) daily report notifications, (3) platform stats refresh, (4) skill demand data refresh, (5) recruiter auto-push (matches candidates to active jobs). Protected by `Authorization: Bearer CRON_SECRET`. Recommended: daily at midnight. Options: Vercel Cron, Railway Cron, GitHub Actions scheduled workflow.

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

### 9.3 Sidebar Reorganization

Navigation items grouped into categories with section headers:
- **(no label):** Dashboard
- **Apply:** Resume Analyzer, Job Match, Job Board, Auto Job Finder, AI Auto-Apply, Smart Auto-Apply
- **Improve:** Resume Tailoring, Cover Letter, Interview Prep, LinkedIn Import, AI Career Coach
- **Insights:** Applications, Career Analytics, Resume Performance, Activity Feed, Salary Insights, Skill Demand, Streak Rewards
- **(no label):** History, Pricing, Settings

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

### 9.8 Notification Copy Improvements

Updated notification messages to be more engaging:
- Auto-Apply confirm: `"X new applications sent!"` → `"Your next interview could be around the corner!"`
- Smart Apply: `"X high-match jobs found for you today!"`
- Daily Report: `"Your daily career update is ready!"`

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
