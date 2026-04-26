# Feature-Wise Gaps, Scenarios, and Dependencies

Date: 2026-04-26  
Scope: Job seeker + recruiter + shared platform features  
Purpose: Production-readiness gap list by feature, including scenario coverage and hard dependencies

---

## Scenario Legend

- **HAPPY:** Normal successful path
- **EDGE:** Boundary/rare but valid inputs
- **FAIL:** API/AI/network/system failures
- **SEC:** Authorization, validation, abuse, data leakage
- **DATA:** Persistence, consistency, reuse across features
- **OPS:** Deploy/env/migration/monitoring concerns

---

## 1) Resume Upload + ATS Analysis

### Dependencies
- **UI:** `/(dashboard)/resume-analyzer`, upload/paste controls
- **API:** `/api/upload-resume`, `/api/analyze-resume`
- **Lib:** parser utils, `lib/ats-resume-analysis.ts`, `lib/ai.ts`, usage/rate-limit libs
- **DB:** `resumes`, `resume_analysis`, `usage_logs`, `ai_usage`
- **Infra:** Gemini/OpenAI keys, Supabase storage + RLS

### Scenarios to cover
- HAPPY: upload PDF/DOCX, analyze, score renders
- EDGE: very large text, malformed docs, empty parsed text
- FAIL: parser fail, AI fail, timeout, rate-limit
- SEC: user B cannot read user A resume/analysis
- DATA: analysis linked to correct resume/user, history visible
- OPS: AI provider fallback works when primary quota hits

### Gaps
- Some user-facing failures remain generic unless `detail` is surfaced in all related endpoints.
- No explicit user-facing retry policy for transient AI failures on every entry point.

---

## 2) Resume Improve / Tailor

### Dependencies
- **UI:** improve actions in resume analyzer/tailor flows
- **API:** `/api/improve-resume`
- **Lib:** prompt guardrails, sanitizers, normalization
- **DB:** `improved_resumes`, `usage_logs`, `ai_usage`

### Scenarios
- HAPPY: improved content generated + saved + rendered
- EDGE: partial sections missing from AI output
- FAIL: malformed JSON from model, guard retry behavior
- SEC: cannot access others' improved resumes
- DATA: re-analyze improved output uses consistent text flattening

### Gaps
- Complex multi-step generation paths can still fail mid-way; partial progress visibility in UI is limited.

---

## 3) Job Match

### Dependencies
- **UI:** `/(dashboard)/job-match`
- **API:** `/api/job-match`
- **Lib:** AI prompt/normalize/sanitize pipeline
- **DB:** `job_matches`, `ai_usage`

### Scenarios
- HAPPY: score + missing skills + improvements
- EDGE: short JD, noisy pasted resume
- FAIL: AI parse fail, provider fail
- DATA: result persisted and appears in history

### Gaps
- Downstream reuse of match output in auto-apply strategy could be tighter (currently parallel systems).

---

## 4) Cover Letter Generator

### Dependencies
- **UI:** `/cover-letter`, job-board generation hooks
- **API:** `/api/generate-cover-letter`, `/api/cover-letters*`
- **Lib:** resume source resolution, `cachedAiGenerate`
- **DB:** `cover_letters`, `ai_usage`

### Scenarios
- HAPPY: generate from resumeText/resumeId/improvedResumeId
- EDGE: source precedence conflicts
- FAIL: AI/provider failure, resume source unavailable
- SEC: ownership checks for resume IDs
- DATA: saved letter is retrievable/editable

### Gaps
- Previously generic 500s; now improved with `detail`, but all dependent UIs should consistently show actionable retry text.

---

## 5) Interview Prep

### Dependencies
- **UI:** `/interview-prep`
- **API:** `/api/interview-prep`
- **Lib:** `cachedAiGenerate`, usage/rate-limit checks
- **DB:** `interview_sessions`, `ai_usage`

### Scenarios
- HAPPY: questions generated and stored
- EDGE: non-tech role prompts
- FAIL: JSON parse issues from AI output
- DATA: session persistence verified

### Gaps
- Output quality variance for broad role families requires stronger schema validation guard consistency.

---

## 6) Auto Job Finder

### Dependencies
- **UI:** `/job-finder`
- **API:** `/api/auto-jobs`
- **Lib:** skill extraction prompt + AI jobs + Adzuna fetch
- **DB:** `job_searches`, `ai_usage`
- **Infra:** Adzuna credentials

### Scenarios
- HAPPY: skill extraction + mixed jobs + reasons
- EDGE: no Adzuna keys (AI-only fallback)
- FAIL: one stage fails while others succeed
- DATA: saved search reproducibility

### Gaps
- Multi-stage pipeline error attribution in UI is coarse (which stage failed is not always explicit).

---

## 7) AI Auto-Apply

### Dependencies
- **UI:** `/auto-apply`
- **API:** `/api/auto-apply`, `/api/auto-apply/[id]`, confirm endpoints
- **Lib:** `lib/autoApplyEngine.ts`, resume structurer, interview score
- **DB:** `auto_apply_runs`, `applications`, `resumes`, `ai_usage`

### Scenarios
- HAPPY: run -> review -> confirm apply
- EDGE: empty job set, low-signal resume
- FAIL: deep match stage fails, timeout, partial apply
- SEC: run access by owner only
- DATA: selected jobs persist correctly before confirm

### Gaps
- Strong dependency chain; one hidden AI stage failure can degrade result quality without always clear user guidance.

---

## 8) Smart Auto-Apply (Cron-driven)

### Dependencies
- **UI:** `/smart-apply`
- **API:** smart apply rules + `/api/smart-apply/trigger`
- **Lib:** smart apply engine + scheduler orchestration
- **DB:** `smart_apply_rules`, `auto_apply_runs`, `applications`
- **Infra:** cron secret + scheduler

### Scenarios
- HAPPY: rule executes automatically and applies
- EDGE: daily/weekly limits reached
- FAIL: cron partial failures
- OPS: secure trigger in production, idempotency

### Gaps
- Operational dependency on scheduler health; needs strong run observability + alerting for failures.

---

## 9) Application Tracker

### Dependencies
- **UI:** `/applications`
- **API:** `/api/applications*`
- **DB:** `applications`

### Scenarios
- HAPPY: create/update stage/view board
- EDGE: duplicate or malformed external applications
- DATA: auto-apply inserts visible immediately

### Gaps
- Duplicate apply prevention and idempotency behavior should be explicitly enforced and documented.

---

## 10) Messaging + Notifications

### Dependencies
- **UI:** `/messages`, `/recruiter/messages`, topbar bell
- **API:** `/api/messages*`, `/api/notifications`
- **DB:** `messages`, `notifications`
- **Infra:** Supabase realtime + optional service-role for cross-user notifications

### Scenarios
- HAPPY: send/receive/read-receipt/thread
- EDGE: attachment MIME/size boundaries
- FAIL: realtime down (poll fallback)
- SEC: role-based recipient restrictions

### Gaps
- Notification delivery quality depends on service role availability; should be explicitly health-checked in deploy.

---

## 11) Recruiter Job Posting + AI Generation/Optimization

### Dependencies
- **UI:** `/recruiter/jobs/new`, `/recruiter/jobs/[id]`, optimize page
- **API:** `/api/recruiter/jobs*`, `/api/recruiter/jobs/generate-description`, `/optimize`
- **DB:** `job_postings`, `ai_usage`

### Scenarios
- HAPPY: create/edit/publish + AI assist
- EDGE: skill arrays, experience ranges, partial data
- FAIL: AI generation fails; user retries
- DATA: optimized output applied and persisted

### Gaps
- Pricing/upgrade journey for recruiter AI usage should be truly transactional (not only CTA/UI-level in pricing).

---

## 12) Recruiter Candidate Search + ATS Screening + Auto-Shortlist

### Dependencies
- **UI:** candidate list/detail, applications list, auto-shortlist page
- **API:** `/api/recruiter/candidates*`, `/api/recruiter/applications/[id]/screen`, `/auto-shortlist`
- **DB:** `users`, `resumes`, `job_applications`, `resume_analysis`, `ai_usage`

### Scenarios
- HAPPY: search -> detail -> analyze -> shortlist
- EDGE: missing parsed resume text
- FAIL: batch AI shortlist partial failures
- SEC: recruiter ownership checks

### Gaps
- Batch shortlist partial failure messaging can be clearer (which batch/application failed).

---

## 13) Recruiter Salary Estimator + Skill Gap

### Dependencies
- **UI:** `/recruiter/salary-estimator`, `/recruiter/skill-gap`
- **API:** `/api/recruiter/salary-estimate`, `/api/recruiter/skill-gap`
- **DB:** job/application tables + `ai_usage`

### Scenarios
- HAPPY: estimator and gap reports returned
- EDGE: manual mode vs application_id mode in skill-gap
- FAIL: AI output schema mismatch

### Gaps
- User guidance around required fields/UUID mode switching could be more explicit.

---

## 14) Usage Dashboard + Credits

### Dependencies
- **UI:** `/usage`, sidebar nav item
- **API:** `/api/usage/summary`, `/history`, `/feature-breakdown`
- **Lib:** `lib/aiUsage.ts`, `lib/aiUsageQueries.ts`, `lib/ai.ts`, `lib/aiRollout.ts`
- **DB:** `ai_usage`, `users.total_credits/used_credits`
- **Migrations:** `20260423150000_ai_usage_credit_tracking.sql`, `20260423183000_ai_usage_grants.sql`
- **Env:** `AI_USAGE_TRACKING_ENABLED`, `AI_CREDITS_ENFORCEMENT_ENABLED`

### Scenarios
- HAPPY: non-zero usage after AI action
- EDGE: cache hit rows still tracked correctly
- FAIL: missing grants/table/env => explicit 500 detail
- SEC: row-level visibility per user only
- OPS: deploy guardrails for migrations + grants

### Gaps
- High ops dependency: if grants/migrations missed in env, dashboard fails/empty.
- Requires mandatory deployment checklist + smoke tests.

---

## 15) Shared Auth / Role / Settings

### Dependencies
- **UI:** login/signup/settings/select-role
- **API:** `/api/user`, `/api/user/role`, profile/avatar endpoints
- **DB:** `users`, storage buckets
- **Middleware:** protected routes and role guards

### Scenarios
- HAPPY: role switch + redirects + persisted state
- EDGE: stale query cache after role switch
- FAIL: auth callback and redirect edge cases
- SEC: unauthorized route/API protection

### Gaps
- Billing-plan state and role state should remain clearly separated in UX and backend transitions.

---

## Cross-Feature Integration Gaps

1. **Commercial integration gap**
   - Upgrade prompts are widespread, but true payment lifecycle completeness must be guaranteed.
2. **Signal reuse gap**
   - Some intelligence APIs/signals exist but are not first-class in all user journeys.
3. **Operational consistency gap**
   - AI-heavy features depend on multiple env and DB prerequisites; launch readiness needs strict checks.
4. **UX consistency gap**
   - Error/retry/confirmation patterns are improved but still not 100% uniform across all mutation surfaces.

---

## Recommended Verification Matrix (minimum before launch)

- Run one complete flow each for:
  - Resume analyze -> improve -> re-analyze
  - Cover letter generation + history persistence
  - Auto-jobs -> auto-apply confirm
  - Recruiter screen + auto-shortlist
- Verify usage metrics update (`/api/usage/*` + `/usage` page) after each flow.
- Toggle credit enforcement and validate `402 CREDITS_EXHAUSTED` across job seeker + recruiter pages.
- Validate migrations and grants in target environment before release.

