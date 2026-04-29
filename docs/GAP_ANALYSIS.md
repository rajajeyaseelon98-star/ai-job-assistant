# Implementation vs Spec – Gap Analysis

Line-by-line and page-by-page comparison of the current AI Job Assistant implementation against the provided specification. **✔** = implemented, **⚠** = partial, **❌** = missing.

**Last updated:** 2026-04-30

## Important note (scope drift)

This file was originally written against an **earlier, smaller spec** (resume analyzer, job match, cover letter, interview prep, dashboard/history/pricing/settings).

Since then, the codebase has grown into a broader platform:

- Job seeker: auto-apply + smart auto-apply, applications tracker, messaging, usage/credits dashboard, PWA install/offline UX
- Recruiter: company onboarding + teams, job postings, application pipeline + events, candidate screening/shortlisting, recruiter messaging, entitlements/pricing simulation
- Email system: Resend delivery, logging, retries, webhooks
- AI reliability: guarded JSON, caching, credit enforcement, provider fallbacks

So, treat this document as **historical** and **not** as a complete reflection of “what the product currently is”.

**Current source of truth for implementation:** `docs/KNOWLEDGE_TRANSFER.md`  
**Current QA expectations:** `docs/TEST_CASES.md`, `docs/TEST_PLAN_E2E.md`, `docs/AUTOMATED_TESTING_STRATEGY.md`

---

## 1️⃣ Dashboard (Main Page)

| Spec | Status | Implementation detail |
|------|--------|------------------------|
| **Welcome back, John 👋** | ✔ | `Welcome back, ${email.split("@")[0]} 👋` (uses email prefix, not display name) |
| **[ Resume Score ] [ Job Match Avg ]** two cards | ⚠ | **Resume Score:** ✔ `ScoreCard` shows latest ATS score (e.g. 82%). **Job Match Avg:** ❌ Not implemented. Second card is **UsageCard** (usage counts), not average job match score. |
| **Quick Actions** | ✔ | Analyze Resume, Match Job, Generate Cover Letter, Interview Prep (+ Upload Resume). Button labels match except spec says "Analyze Job Match" for job match – we use "Match Job". |
| **Recent Activity** | ⚠ | We show resume analyses and job matches with **date only** (e.g. `3/7/2025`). Spec shows **relative time** (e.g. "2 hours ago", "yesterday"). **Cover letter** entries never appear because we don’t persist cover letters. |
| **Backend: latest_resume_score** | ✔ | `resume_analysis` ordered by `created_at` desc, first row `score`. |
| **Backend: avg_job_match** | ❌ | Not queried or displayed. Need `AVG(match_score)` from `job_matches` for current user. |
| **Backend: recent_activity** | ⚠ | Built from `resume_analysis` + `job_matches` only. No `cover_letters` or `interview_sessions` (tables don’t exist). |

**Tables per spec:** `users` ✔, `resumes` ✔, `job_matches` ✔, `cover_letters` ❌, `interview_sessions` ❌.

---

## 0️⃣ New platform areas (not covered by the original spec)

The following major areas are implemented but were not part of the original “spec vs implementation” checklist:

- **AI credits + usage tracking**: `ai_usage`, `/api/usage/*`, dashboard UI, `CREDITS_EXHAUSTED` handling.
- **Auto-apply + smart auto-apply**: engine + run receipts/timelines, confirmations, and cron-triggered automation.
- **Messaging**: threads, attachments, realtime indicators, read receipts, recipient search RPC.
- **Recruiter marketplace**: companies, memberships/invites, jobs, applications lifecycle, events timeline, in-app notifications, team sharing.
- **Email delivery**: Resend send, `email_logs`, retry endpoint, webhook lifecycle updates.
- **PWA**: manifest/icons, install CTA, offline fallback UX, dev SW reset.

If you want a *current* gap report, use `docs/FEATURE_WISE_GAPS_SCENARIOS_DEPENDENCIES.md` and `docs/LAUNCH_READINESS_GAP_REPORT.md`.

## 2️⃣ Resume Analyzer

| Spec | Status | Implementation detail |
|------|--------|------------------------|
| **Upload PDF / DOCX** | ✔ | `ResumeUpload` + `/api/upload-resume`, Supabase Storage. |
| **Extract text** | ✔ | `pdf-parse`, `mammoth` in upload route. |
| **Paste Resume Text** | ✔ | Textarea below upload. |
| **Send to AI → ATS analysis** | ✔ | Gemini via `/api/analyze-resume`, JSON prompt. |
| **Return JSON: atsScore, missingSkills, improvements, recommendedRoles** | ✔ | We use `resumeImprovements` (same as “improvements”). |
| **Save to resume_analysis** | ✔ | Insert with `score` = atsScore, `analysis_json` = full object. |
| **Result: ATS Score %, Missing Skills, Improvements, Suggested Roles** | ✔ | `ResumeAnalysisResult` shows all four in the requested layout. |
| **Button: [ Analyze Resume ]** | ✔ | "Analyze resume" (minor wording). |

**No missing features.** Flow and backend match spec.

---

## 3️⃣ Job Match

| Spec | Status | Implementation detail |
|------|--------|------------------------|
| **Paste Job Description + compare with resume** | ✔ | `JobMatchForm`: resume text + job description, POST `/api/job-match`. |
| **AI return JSON: matchScore, matchedSkills, missingSkills, resumeImprovements** | ⚠ | **Implemented:** `match_score`, `missing_skills`, `recommended_keywords`. **Missing:** `matchedSkills`, `resumeImprovements`. Prompt and types only have missing_skills and recommended_keywords. |
| **Result UI: Job Match Score %, Matched Skills, Missing Skills, Resume Improvements** | ⚠ | We show **Match score**, **Missing skills**, **Recommended keywords**. No **Matched Skills** or **Resume Improvements** section. |
| **Table job_matches: id, user_id, resume_id, job_description, match_score, analysis, created_at** | ⚠ | We have: `resume_id`, `job_description`, `match_score`, `missing_skills` (JSONB). No `user_id` (user inferred via resume). No `analysis` column (full result); we only store `missing_skills`. |
| **Button: [ Analyze Job Match ]** | ⚠ | We use "Match resume". |

**Summary:** Job match works but doesn’t match spec for API response shape, DB columns, or result UI (matched skills + resume improvements).

---

## 4️⃣ Cover Letter Generator

| Spec | Status | Implementation detail |
|------|--------|------------------------|
| **Inputs: Company Name, Job Title, Job Description, Resume** | ✔ | Company name, Role (job title), Job description, Resume text. |
| **Generate professional cover letter** | ✔ | `/api/generate-cover-letter`, OpenAI (no Gemini path). |
| **Buttons: Copy, Download PDF, Edit** | ⚠ | **Copy** ✔. **Download** ✔ but as **.txt** only; **Download PDF** ❌. **Edit** ❌ (no inline edit). |
| **Table: cover_letters** | ❌ | Not in schema. Cover letters are not saved; no history or “View/Download” from History. |

**Summary:** Generation and Copy/Download (txt) work; PDF download, Edit, and persistence are missing.

---

## 5️⃣ Interview Prep

| Spec | Status | Implementation detail |
|------|--------|------------------------|
| **Select Role** | ✔ | Text input (e.g. "Frontend Developer"). |
| **Experience Level (Junior / Mid / Senior)** | ❌ | Not in form or API. |
| **Generate Questions** | ✔ | `/api/interview-prep`, returns technical + behavioral. |
| **Result: Technical, Behavioral, Coding questions** | ⚠ | **Technical** ✔, **Behavioral** ✔. **Coding questions** (e.g. “Implement debounce”) ❌ – prompt and response only have technical + behavioral. |
| **Table: interview_sessions** | ❌ | Not in schema. No persistence of generated Q&A or sessions. |
| **Bonus: AI mock interview** | ❌ | Not implemented. |

**Summary:** Role-based technical + behavioral questions work; experience level, coding section, and interview_sessions are missing.

---

## 6️⃣ History

| Spec | Status | Implementation detail |
|------|--------|------------------------|
| **Section: Resume Analysis** (e.g. May 10 – ATS 82) | ✔ | We list resume analyses with date and ATS score. |
| **Section: Job Matches** (e.g. React Developer – 72%) | ⚠ | We show “Job match” + match %. Spec implies a **role/title** per match (e.g. “React Developer”); we don’t store or show role, only job_description snippet. |
| **Section: Cover Letters** (e.g. ABC Company, XYZ Startup) | ❌ | No `cover_letters` table or API, so no data to show. |
| **Actions: View, Download, Delete** | ⚠ | **View** ✔ (link to feature page). **Download** ❌ per item. **Delete** ❌. |
| **Layout: Three blocks (Resume Analysis, Job Matches, Cover Letters)** | ⚠ | We have one combined “Recent activity” list, not three separate sections. |

**Summary:** History is resume + job match only; no cover letters, no per-item download/delete, no role per job match.

---

## 7️⃣ Pricing

| Spec | Status | Implementation detail |
|------|--------|------------------------|
| **FREE: 3 Resume Analyses, 3 Job Matches, 1 Cover Letter** | ⚠ | We enforce **2** analyses, **1** job match, 1 cover letter in `lib/usage.ts`. Spec says 3 and 3. |
| **PRO: ₹199/month, unlimited** | ✔ | Shown and enforced for unlimited. |
| **PREMIUM: ₹499, Mock Interviews, Career Roadmap** | ❌ | No Premium tier in UI or backend. |
| **Payment: Stripe or Razorpay** | ❌ | No payment integration; “Upgrade” only links to settings/pricing. |

**Summary:** Free limits differ from spec (2 vs 3, 1 vs 3); Premium and payments are missing.

---

## 8️⃣ Settings

| Spec | Status | Implementation detail |
|------|--------|------------------------|
| **Profile: Name, Email, Experience Level** | ⚠ | We show **Email** and **Plan**. No **Name** (users table has no name). No **Experience Level**. |
| **Career Preferences: Preferred Role, Location, Salary** | ❌ | Not in UI or DB. |
| **Subscription: Current Plan, Upgrade** | ✔ | Plan + link to pricing. |
| **Danger Zone: Delete Account** | ❌ | Not implemented. |
| **Tables: user_preferences, subscriptions** | ❌ | Not in schema. Only `users` with `plan_type`. |

**Summary:** Only email and plan are covered; name, experience level, preferences, delete account, and extra tables are missing.

---

## Backend Tables Summary

| Spec table | In schema? | Notes |
|------------|------------|--------|
| users | ✔ | We have id, email, created_at, plan_type. No name. |
| resumes | ✔ | |
| job_matches | ✔ | No user_id, no analysis column; we have missing_skills. |
| cover_letters | ❌ | |
| interview_sessions | ❌ | |
| user_preferences | ❌ | |
| subscriptions | ❌ | |
| resume_analysis | ✔ | (we use it; spec implies it) |
| usage_logs | ✔ | (we use; not in spec list) |

---

## Cross-Cutting / Existing Functionality

| Area | Status | Notes |
|------|--------|--------|
| **Resume analysis** | ✔ | Gemini, JSON, UI and DB aligned with spec. |
| **Job match** | ⚠ | Works but API/UI/DB don’t match spec (matchedSkills, resumeImprovements, analysis column). |
| **Cover letter** | ⚠ | No Gemini path; uses OpenAI only. If only GEMINI_API_KEY is set, this and job match / interview prep can fail. |
| **Interview prep** | ⚠ | Same as above; OpenAI only. |
| **Auth** | ✔ | Sign up, login, logout, reset password, Supabase Auth, users table. |
| **RLS** | ✔ | Policies on users, resumes, resume_analysis, job_matches, usage_logs. |
| **Free limits** | ⚠ | Enforced but limits differ from spec (see Pricing). |

---

## What’s Missing (Prioritised)

1. **Dashboard:** Job Match Avg card; optional relative time for activity; cover letter / interview entries when those tables exist.
2. **Job Match:** Add `matchedSkills` and `resumeImprovements` to prompt, API, types, DB (e.g. `analysis` JSONB), and UI.
3. **Cover Letter:** Persist to `cover_letters` table; add to History; optional Download PDF and Edit.
4. **Interview Prep:** Experience level (Junior/Mid/Senior); optional coding questions section; `interview_sessions` table if you want history.
5. **History:** Three-section layout; cover letters section; optional Download/Delete per item; store/display role for job matches.
6. **Pricing:** Align free limits with spec (3 analyses, 3 matches); add Premium tier and Stripe/Razorpay if required.
7. **Settings:** Name and experience level (and DB fields); career preferences and user_preferences; Delete Account; subscriptions table if doing real billing.
8. **Tables:** `cover_letters`, `interview_sessions`; optionally `user_preferences`, `subscriptions`.

Nothing in this list indicates that existing features (e.g. resume analyzer, auth, RLS) were broken by current code; the main gaps are missing fields/tables, spec mismatches (job match, limits), and missing flows (payments, delete account, mock interview).
