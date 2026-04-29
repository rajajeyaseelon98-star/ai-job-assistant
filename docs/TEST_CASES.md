# AI Job Assistant — Comprehensive Test Cases Document

**Purpose:** In-depth test cases for every feature flow. Covers happy paths, edge cases, error handling, and integration scenarios.

**Last updated:** 2026-04-23 (Added AI usage/credit system QA coverage in **Section 50**, including DB migrations/grants validation, usage APIs, credit enforcement (`CREDITS_EXHAUSTED`), usage dashboard assertions, and observability checks. Previous updates retained below.)

---

## Table of Contents

1. [Authentication & Onboarding](#1-authentication--onboarding)
2. [Resume Upload & ATS Analysis](#2-resume-upload--ats-analysis)
3. [Resume Improvement](#3-resume-improvement)
4. [Job Matching](#4-job-matching)
5. [Cover Letter Generation](#5-cover-letter-generation)
6. [Interview Preparation](#6-interview-preparation)
7. [Auto Job Finder](#7-auto-job-finder)
8. [AI Auto-Apply](#8-ai-auto-apply)
9. [Smart Auto-Apply](#9-smart-auto-apply)
10. [Resume Tailoring](#10-resume-tailoring)
11. [LinkedIn Import](#11-linkedin-import)
12. [Application Tracker](#12-application-tracker)
13. [AI Career Coach](#13-ai-career-coach)
14. [Streak System & Rewards](#14-streak-system--rewards)
15. [Daily Actions](#15-daily-actions)
16. [Opportunity Alerts](#16-opportunity-alerts)
17. [Candidate Boost & Ranking](#17-candidate-boost--ranking)
18. [Skill Demand Dashboard](#18-skill-demand-dashboard)
19. [Salary Intelligence](#19-salary-intelligence)
20. [Resume Performance Index](#20-resume-performance-index)
21. [Candidate Competition](#21-candidate-competition)
22. [Hiring Prediction](#22-hiring-prediction)
23. [Shareable Results](#23-shareable-results)
24. [Notifications System](#24-notifications-system)
25. [Public Profiles](#25-public-profiles)
26. [SEO Pages](#26-seo-pages)
27. [Recruiter: Job Posting](#27-recruiter-job-posting)
28. [Recruiter: Candidate Search & ATS](#28-recruiter-candidate-search--ats)
29. [Recruiter: Instant Shortlist](#29-recruiter-instant-shortlist)
30. [Recruiter: Messaging](#30-recruiter-messaging)
31. [Recruiter: Intelligence Dashboard](#31-recruiter-intelligence-dashboard)
32. [Recruiter: Auto-Push](#32-recruiter-auto-push)
33. [AI Cache System](#33-ai-cache-system)
34. [Rate Limiting](#34-rate-limiting)
35. [Cron Jobs](#35-cron-jobs)
36. [Cross-Feature Integration Tests](#36-cross-feature-integration-tests)
37. [Security & Authorization](#37-security--authorization)
38. [Database Integrity](#38-database-integrity)
49. [Dashboard, history, jobs applied, and public APIs](#49-dashboard-history-jobs-applied-and-public-apis)
50. [AI Usage Tracking & Credits](#50-ai-usage-tracking--credits)
51. [Automated QA Regression Suite](#51-automated-qa-regression-suite)

---

## 1. Authentication & Onboarding

### TC-1.1: Successful login
- **Precondition:** User has verified account
- **Steps:**
  1. Navigate to `/login`
  2. Enter valid email and password
  3. Click "Login"
- **Expected:** Redirect to `/dashboard`. User session cookie set. `getUser()` returns valid user profile.

### TC-1.2: Login with unverified email
- **Precondition:** User signed up but hasn't verified email
- **Steps:**
  1. Navigate to `/login`
  2. Enter credentials
  3. Click "Login"
- **Expected:** Redirect to `/login?error=verify`. Error message displayed.

### TC-1.3: Access protected route without auth
- **Steps:**
  1. Clear session/cookies
  2. Navigate directly to `/dashboard`
- **Expected:** Redirect to `/login?next=/dashboard`. After login, redirect back to `/dashboard`.

### TC-1.4: Access protected API without auth
- **Steps:**
  1. Call `GET /api/usage` without session cookies
- **Expected:** 401 JSON response `{ error: "Unauthorized" }`.

### TC-1.5: First-time user onboarding
- **Steps:**
  1. Sign up with new email
  2. Verify email
  3. Login
- **Expected:** `ensureUserRow` creates user with `plan_type: "free"`, `role: "job_seeker"`. User lands on dashboard.

### TC-1.6: Role selection
- **Steps:**
  1. Navigate to `/select-role`
  2. Click "Recruiter"
- **Expected:** `PATCH /api/user/role` updates `users.role = "recruiter"`. Redirect to `/recruiter`.

### TC-1.7: Role switch from recruiter to job seeker
- **Steps:**
  1. As recruiter, click "Switch to Job Seeker" in sidebar
- **Expected:** Role updated. Redirect to `/dashboard`. Sidebar shows job seeker navigation.

### TC-1.8: Sanitized redirect path
- **Steps:**
  1. Attempt login with `next=https://evil.com/steal`
- **Expected:** `sanitizeRedirectPath` rejects the URL. Redirects to `/dashboard` instead.

### TC-1.9: Account deletion
- **Steps:**
  1. Go to settings
  2. Click "Delete Account"
  3. Confirm
- **Expected:** All user data deleted (resumes, analyses, applications, etc.). Auth user deleted. Redirected to login.

---

## 2. Resume Upload & ATS Analysis

### TC-2.1: Upload PDF resume
- **Precondition:** Logged in, free plan
- **Steps:**
  1. Navigate to `/resume-analyzer`
  2. Upload a valid PDF file (<5MB)
  3. Click "Analyze"
- **Expected:** Resume parsed (text extracted via pdf-parse). Stored in Supabase storage. Row inserted in `resumes`. Analysis returns ATS score (0-100), missing skills, improvements.

### TC-2.2: Upload DOCX resume
- **Steps:**
  1. Upload a valid .docx file
- **Expected:** Parsed via mammoth. Same flow as PDF.

### TC-2.3: Upload oversized file (>5MB)
- **Steps:**
  1. Upload a 10MB PDF
- **Expected:** 400 error: "File too large. Max 5MB."

### TC-2.4: Upload unsupported format
- **Steps:**
  1. Upload a .jpg file
- **Expected:** 400 error indicating unsupported format.

### TC-2.5: Paste resume text
- **Steps:**
  1. Paste resume text directly into textarea
  2. Click "Analyze"
- **Expected:** Analysis works without upload. No `resumes` row created (no resumeId). Score and feedback returned.

### TC-2.6: Free plan usage limit (3/month)
- **Steps:**
  1. Analyze 3 resumes successfully
  2. Attempt 4th analysis
- **Expected:** 403 response: "Usage limit reached." UI shows upgrade prompt.

### TC-2.7: Pro plan unlimited usage
- **Precondition:** Pro plan user
- **Steps:**
  1. Analyze 10+ resumes in one month
- **Expected:** All analyses succeed. `canUseFeature` returns `allowed: true` for pro.

### TC-2.8: Cached analysis (same resume)
- **Steps:**
  1. Analyze resume text "X"
  2. Analyze same text "X" again
- **Expected:** Second call returns cached result (no AI API call). Response time significantly faster. Same score returned.

### TC-2.9: Rate limit hit
- **Steps:**
  1. Send 11 analysis requests within 1 minute
- **Expected:** 11th request returns 429: "Too many requests. Try again in X seconds."

### TC-2.10: Streak XP awarded on analysis
- **Steps:**
  1. Analyze a resume
  2. Check streak data
- **Expected:** `recordDailyActivity(userId, "resume_analyze")` called. 15 XP awarded (multiplied by streak multiplier).

### TC-2.11: Re-analyze after improvement
- **Steps:**
  1. Analyze resume → get score 55
  2. Improve resume
  3. Click "Re-analyze improved resume"
- **Expected:** New analysis with `recheckAfterImprovement=true`. Uses RECHECK_PROMPT. Shows comparison (before vs after).

---

## 3. Resume Improvement

### TC-3.1: Improve resume (Pro user)
- **Precondition:** Pro plan
- **Steps:**
  1. Click "Improve with AI" from analyzer
- **Expected:** AI returns ImprovedResumeContent (summary, skills, experience, projects, education). Saved to `improved_resumes`. Activity logged.

### TC-3.2: Improve resume (Free user blocked)
- **Precondition:** Free plan
- **Steps:**
  1. Attempt resume improvement
- **Expected:** 403: "Feature requires Pro or Premium plan."

### TC-3.3: Download as DOCX
- **Steps:**
  1. Improve resume
  2. Click "Download DOCX"
- **Expected:** DOCX file downloaded. Contains formatted sections. Includes "Created with AI Job Assistant" watermark footer.

### TC-3.4: Download as PDF
- **Steps:**
  1. Click "Download PDF"
- **Expected:** PDF generated via print(). Clean formatting.

### TC-3.5: Copy to clipboard
- **Steps:**
  1. Click "Copy"
- **Expected:** Plain text version in clipboard. Success toast "Copied!"

### TC-3.6: Improve with job context
- **Steps:**
  1. Provide resume text + job title + job description
- **Expected:** Improved resume is tailored to the specific job. Relevant skills emphasized.

---

## 4. Job Matching

### TC-4.1: Match resume to job
- **Steps:**
  1. Enter resume text
  2. Enter job description
  3. Click "Match"
- **Expected:** Match score (0-100), missing skills list, detailed analysis. Saved to `job_matches`.

### TC-4.2: High match score (>80%)
- **Steps:**
  1. Match well-aligned resume to job
- **Expected:** Score 80+. Few or no missing skills. Positive analysis.

### TC-4.3: Low match score (<40%)
- **Steps:**
  1. Match unrelated resume (e.g., teacher resume vs software engineer job)
- **Expected:** Score <40. Many missing skills. Suggestions to improve alignment.

### TC-4.4: Usage tracking
- **Steps:**
  1. Perform 3 job matches on free plan
  2. Attempt 4th
- **Expected:** 4th attempt blocked with usage limit message.

---

## 5. Cover Letter Generation

### TC-5.1: Generate cover letter
- **Steps:**
  1. Enter company name, job title, job description, resume text
  2. Click "Generate"
- **Expected:** Professional cover letter generated. Saved to `cover_letters`. Includes company-specific and role-specific content.

### TC-5.2: Free plan limit (1/month)
- **Steps:**
  1. Generate 1 cover letter
  2. Attempt 2nd
- **Expected:** Blocked with upgrade prompt.

### TC-5.3: View cover letter history
- **Steps:**
  1. Navigate to history page
- **Expected:** Previous cover letters listed with company, title, date.

### TC-5.4: Edit and save cover letter
- **Steps:**
  1. Open saved cover letter
  2. Edit content
  3. Save
- **Expected:** Updated in `cover_letters` table.

---

## 6. Interview Preparation

### TC-6.1: Generate interview questions
- **Steps:**
  1. Select role: "Frontend Developer"
  2. Select level: "Senior"
  3. Click "Prepare"
- **Expected:** Questions grouped by category (behavioral, technical, situational). Each has sample answer and tips.

### TC-6.2: With resume context
- **Steps:**
  1. Provide resume text along with role
- **Expected:** Questions personalized to user's experience.

### TC-6.3: Pro-only feature check
- **Precondition:** Free plan (interview_prep limit = 0)
- **Steps:**
  1. Attempt interview prep
- **Expected:** Blocked. Upgrade prompt shown.

---

## 7. Auto Job Finder

### TC-7.1: Find jobs with Adzuna integration
- **Precondition:** ADZUNA_APP_ID and ADZUNA_APP_KEY configured
- **Steps:**
  1. Upload resume
  2. Enter location: "Bangalore"
  3. Click "Find Jobs"
- **Expected:** Skills extracted from resume (via AI, cached 7d). Adzuna API queried. Jobs returned with title, company, salary, location, apply link.

### TC-7.2: Find jobs without Adzuna
- **Precondition:** No Adzuna keys configured
- **Steps:**
  1. Find jobs
- **Expected:** AI-generated job suggestions only. No Adzuna results.

### TC-7.3: Source filter
- **Steps:**
  1. Find jobs (Adzuna + AI results mixed)
  2. Filter by "Adzuna" source
  3. Filter by "AI Suggested"
- **Expected:** Correct filtering per source.

### TC-7.4: Free plan limit (1/month)
- **Steps:**
  1. Find jobs once
  2. Attempt again
- **Expected:** Blocked with upgrade prompt.

### TC-7.5: Job history
- **Steps:**
  1. Navigate to history
- **Expected:** Past job searches listed with date, skills, result count.

---

## 8. AI Auto-Apply

### TC-8.1: Full auto-apply flow (happy path)
- **Precondition:** Free plan (2 uses/month), uploaded resume with structured_json
- **Steps:**
  1. Navigate to `/auto-apply`
  2. Select resume
  3. Set location: "Remote"
  4. Set max results: 10
  5. Click "Start Auto-Apply"
  6. Wait for processing (poll every 3s)
  7. Review matched jobs
  8. Select 3 jobs
  9. Click "Confirm & Apply"
- **Expected:**
  - Run created (status: pending → processing → ready_for_review)
  - 10+ jobs found from Adzuna + internal
  - Pre-filtered to top 10 (JS scoring, no AI cost)
  - Deep AI match on top 10: match_score + cover_letter per job
  - Interview probability calculated per job (HIGH/MEDIUM/LOW)
  - User reviews, selects 3
  - 3 applications created in `applications` table (status: "applied")
  - Milestone check runs
  - Notification sent
  - Run status → "completed"

### TC-8.2: Free plan usage limit
- **Steps:**
  1. Complete 2 auto-apply runs
  2. Attempt 3rd
- **Expected:** 403: "Usage limit reached." Shows "Upgrade to Pro for unlimited."

### TC-8.3: Resume without structured_json
- **Steps:**
  1. Start auto-apply with resume that hasn't been structured yet
- **Expected:** `getOrCreateStructuredResume` triggers AI extraction on first access. Skills synced to `candidate_skills` and `skill_badges`. Auto-apply proceeds normally.

### TC-8.4: No jobs found
- **Steps:**
  1. Use resume with very niche skills, obscure location
- **Expected:** Run completes with 0 matches. Status: ready_for_review with empty results. UI shows "No matches found" message.

### TC-8.5: Polling during processing
- **Steps:**
  1. Start auto-apply
  2. Observe frontend polling
- **Expected:** `GET /api/auto-apply/{id}` returns status. Frontend shows progress indicator. Polls every 3 seconds. Stops polling on ready_for_review or failed.

### TC-8.6: Deselect and reselect jobs
- **Steps:**
  1. Auto-apply completes with 5 matched jobs
  2. Select all 5
  3. Deselect 2
  4. Click "Confirm"
- **Expected:** Only 3 selected jobs applied to. PATCH updates selected_job_ids before confirm.

### TC-8.7: 2-minute timeout safety
- **Steps:**
  1. Start auto-apply run
  2. Simulate AI taking >2 minutes
- **Expected:** Engine has timeout safety. Run fails gracefully with error_message. Status: "failed".

### TC-8.8: Interview probability scores
- **Steps:**
  1. Complete auto-apply
  2. Review JobMatchCard
- **Expected:** Each job shows interview probability (score 0-100, level HIGH/MEDIUM/LOW). Expandable panel shows reasons and boost tips.

### TC-8.9: XP and streak recording
- **Steps:**
  1. Confirm auto-apply
- **Expected:** `recordDailyActivity(userId, "apply")` called. 10 XP per application (× streak multiplier).

---

## 9. Smart Auto-Apply

### TC-9.1: Create smart apply rule (Pro)
- **Precondition:** Pro plan
- **Steps:**
  1. Navigate to `/smart-apply`
  2. Select resume
  3. Set min match score: 70%
  4. Set salary range: ₹5L - ₹15L
  5. Add roles: "Frontend Developer", "React Developer"
  6. Set daily limit: 3
  7. Save
- **Expected:** Rule created in `smart_apply_rules` with enabled=true. next_run_at set.

### TC-9.2: Free plan blocked
- **Precondition:** Free plan
- **Steps:**
  1. Attempt to create smart apply rule
- **Expected:** 403: "Pro/Premium feature."

### TC-9.3: Cron executes smart rule
- **Steps:**
  1. Create enabled rule
  2. Trigger cron: POST /api/smart-apply/trigger
- **Expected:** Rule processed. Auto-apply run created. Jobs matching thresholds auto-selected. Applications created without user confirmation. Notification sent. Rule updated: last_run_at, total_runs, total_applied.

### TC-9.4: Daily/weekly limits respected
- **Steps:**
  1. Set daily limit: 2, weekly limit: 5
  2. Trigger cron 3 days in a row
- **Expected:** Day 1: 2 apps. Day 2: 2 apps. Day 3: 1 app (weekly limit of 5 reached).

### TC-9.5: Toggle enable/disable
- **Steps:**
  1. Disable a rule
  2. Trigger cron
- **Expected:** Disabled rule skipped. No applications.

### TC-9.6: Min match score filter
- **Steps:**
  1. Set min match score: 85%
- **Expected:** Only jobs with match_score >= 85% are auto-applied.

---

## 10. Resume Tailoring

### TC-10.1: Tailor resume for specific job
- **Steps:**
  1. Navigate to `/tailor-resume`
  2. Enter resume text
  3. Enter job description + job title
  4. Click "Tailor"
- **Expected:** Same /api/improve-resume endpoint called with jobTitle + jobDescription. Result emphasizes relevant skills/experience for the target job.

### TC-10.2: Download tailored resume
- **Steps:**
  1. After tailoring, download as DOCX
- **Expected:** Tailored content in formatted DOCX. Job-specific summary and skills order.

---

## 11. LinkedIn Import

### TC-11.1: Import from LinkedIn text
- **Steps:**
  1. Paste LinkedIn profile text (>50 chars)
  2. Click "Import"
- **Expected:** AI parses text into ImprovedResumeContent format. User can download as PDF/DOCX.

### TC-11.2: Text too short
- **Steps:**
  1. Paste text <50 characters
- **Expected:** 400: "Profile text too short." Min 50 characters required.

### TC-11.3: Import from LinkedIn PDF
- **Steps:**
  1. Upload LinkedIn PDF export
- **Expected:** PDF parsed, then AI converts to structured format.

---

## 12. Application Tracker

### TC-12.1: Add application manually
- **Steps:**
  1. Navigate to `/applications`
  2. Click "Add Application"
  3. Fill: company="Google", role="SDE", status="applied"
  4. Save
- **Expected:** Application created. Activity logged. Milestone checked (first app? 10th?).

### TC-12.2: Update application status
- **Steps:**
  1. Change application from "Applied" to "Interviewing"
- **Expected:** Status updated. Activity logged if relevant.

### TC-12.3: Board view (Kanban)
- **Steps:**
  1. Toggle to board view
- **Expected:** Applications in columns: Saved | Applied | Interviewing | Offer | Rejected. Drag to change status.

### TC-12.4: Application milestone logging
- **Steps:**
  1. Reach 10 applications total
- **Expected:** `checkAndLogMilestones` logs "10 Applications" milestone in activity_feed. Is_public=true for social proof.

### TC-12.5: Delete application
- **Steps:**
  1. Delete an application
- **Expected:** Removed from applications table. Total count decremented.

---

## 13. AI Career Coach

### TC-13.1: New user with no data
- **Precondition:** User just signed up, no resume or applications
- **Steps:**
  1. Navigate to `/career-coach`
- **Expected:** Status: "new". Recommendation to upload resume and start applying. No problems diagnosed (insufficient data).

### TC-13.2: User with low ATS score
- **Precondition:** User has resume with ATS score 45
- **Steps:**
  1. View career coach
- **Expected:** Problem diagnosed: "Low ATS Score". Fix steps: improve keywords, format, relevant skills. Status: "struggling" or "critical".

### TC-13.3: User applying to wrong roles
- **Precondition:** 20+ applications, <10% interview rate
- **Steps:**
  1. View career coach
- **Expected:** Problem: "Wrong Role Targeting". Career direction shows which roles are "weak" vs "strong". Suggestion to refocus.

### TC-13.4: Skill ROI analysis
- **Precondition:** User has skills in candidate_skills, skill_demand data exists
- **Steps:**
  1. View Skill ROI section
- **Expected:** Three categories:
  - Highlight: user has skill + high market demand → "Keep showcasing React"
  - Learn: high demand + user doesn't have → "Learn TypeScript"
  - Remove: user has + low demand → "De-emphasize jQuery"

### TC-13.5: Weekly summary
- **Precondition:** User active for 2+ weeks
- **Steps:**
  1. View weekly summary
- **Expected:** This week vs last week comparison. Applications count, interviews, response rate. Trend arrow (improving/declining/stable).

### TC-13.6: Score transparency
- **Steps:**
  1. View score transparency section
- **Expected:** ATS breakdown (skill match, format, keywords, experience weights). Interview probability factors (4 weights, note about dynamic adjustment). Candidate rank components (profile, ATS, skills, activity, boost).

### TC-13.7: Thriving user
- **Precondition:** 25%+ interview rate, good ATS, active applications
- **Steps:**
  1. View career coach
- **Expected:** Status: "thriving" (green banner). Few or no problems. Positive insights.

---

## 14. Streak System & Rewards

### TC-14.1: Start a new streak
- **Precondition:** No existing streak
- **Steps:**
  1. Login and visit dashboard
- **Expected:** `recordDailyActivity(userId, "daily_login")` creates streak. current_streak=1. 5 XP awarded. Level: "Newcomer".

### TC-14.2: Continue streak (consecutive day)
- **Precondition:** Streak = 6, last active yesterday
- **Steps:**
  1. Login today
- **Expected:** current_streak=7. Longest streak updated if needed. Multiplier: 1.25x. 5*1.25 = 6.25 XP (rounded). Level: "On a Roll".

### TC-14.3: Streak break (missed 1 day, no freeze)
- **Precondition:** Streak = 10, streak_freeze_count = 0, last active 2 days ago
- **Steps:**
  1. Login after missing 1 day
- **Expected:** Streak reset to 1. Multiplier reset to 1.0. Previous streak preserved in longest_streak if applicable.

### TC-14.4: Streak freeze used
- **Precondition:** Streak = 10, streak_freeze_count = 1, last active 2 days ago (missed 1 day)
- **Steps:**
  1. Login after missing 1 day
- **Expected:** Freeze consumed. streak_freeze_count = 0. Streak continues at 11. No reset.

### TC-14.5: Streak break (missed 2+ days)
- **Precondition:** Streak = 20, last active 3 days ago
- **Steps:**
  1. Login
- **Expected:** Streak reset to 1 regardless of freeze tokens. Freezes only protect 1-day gaps.

### TC-14.6: 3-day streak reward (streak freeze token)
- **Steps:**
  1. Reach 3-day streak
- **Expected:** `checkAndClaimRewards(userId, 3)` auto-fires. users.streak_freeze_count += 1. Notification: "Streak Shield Unlocked!". Activity feed entry with reward_claimed: true.

### TC-14.7: 7-day streak reward (auto-apply credit)
- **Precondition:** Free plan, 2/2 auto-apply credits used
- **Steps:**
  1. Reach 7-day streak
- **Expected:** Most recent auto_apply usage_log deleted. User now at 1/2 usage. Can run 1 more auto-apply. Notification sent.

### TC-14.8: 14-day streak reward (3-day profile boost)
- **Steps:**
  1. Reach 14-day streak
- **Expected:** `activateBoost(userId, 3, 2.0)`. users.is_boosted=true. boost_expires_at = now+3 days. boost_multiplier=2.0.

### TC-14.9: 75-day streak reward (Pro trial)
- **Precondition:** Free plan
- **Steps:**
  1. Reach 75-day streak
- **Expected:** plan_type changed to "pro". boost_expires_at = now+7 days (trial expiry). All pro features unlocked. Notification with expiry date.

### TC-14.10: 75-day streak reward (already Pro)
- **Precondition:** Pro plan (paid)
- **Steps:**
  1. Reach 75-day streak
- **Expected:** Pro trial reward skipped (user already pro). Notification may still fire but plan not changed.

### TC-14.11: Pro trial expiry
- **Precondition:** Pro trial from 75-day reward, 8 days passed, no paid subscription
- **Steps:**
  1. Any API call that triggers `checkBoostStatus`
- **Expected:** boost_expires_at has passed. Boost reverted (is_boosted=false). Plan checked: no active subscription → plan_type reverted to "free".

### TC-14.12: Pro trial expiry with paid subscription
- **Precondition:** Pro trial expired but user has active subscription
- **Steps:**
  1. Any API call triggers `checkBoostStatus`
- **Expected:** Boost reverted. But plan_type stays "pro" (active subscription found).

### TC-14.13: 100-day streak reward (permanent boost)
- **Steps:**
  1. Reach 100-day streak
- **Expected:** boost_multiplier=1.5, is_boosted=true, boost_expires_at=null (won't auto-expire).

### TC-14.14: Double claim prevention
- **Steps:**
  1. Reach 7-day streak, reward auto-claimed
  2. Manually POST /api/streak-rewards { streak_days: 7 }
- **Expected:** Second claim rejected: "Reward already claimed."

### TC-14.15: XP multiplier stacking
- **Steps:**
  1. 30-day streak (2x multiplier)
  2. Analyze resume (15 XP base)
- **Expected:** 15 * 2.0 = 30 XP awarded.

### TC-14.16: View rewards page
- **Steps:**
  1. Navigate to `/streak-rewards`
- **Expected:** Shows current streak, progress bar. Rewards: locked (future), unlocked (claimable), claimed (past). Correct state for each tier.

---

## 15. Daily Actions

### TC-15.1: Auto-generate daily actions
- **Steps:**
  1. Visit dashboard (first time today)
- **Expected:** `generateDailyActions(userId)` creates 3-5 personalized actions. Priority-ordered. Stored in `daily_actions`.

### TC-15.2: Actions not regenerated same day
- **Steps:**
  1. Visit dashboard twice in same day
- **Expected:** Second visit returns existing actions (not regenerated).

### TC-15.3: Complete an action
- **Steps:**
  1. Complete "Improve your resume" action
- **Expected:** Action marked completed. Progress bar updates. XP awarded via `recordDailyActivity`. Streak maintained.

### TC-15.4: All actions completed
- **Steps:**
  1. Complete all 5 actions in a day
- **Expected:** 100% progress. Celebration animation. All actions show checkmarks.

### TC-15.5: Urgent action present
- **Precondition:** User has unread recruiter push from today
- **Steps:**
  1. View daily actions
- **Expected:** "Respond to recruiter" action at top with URGENT priority (red label).

### TC-15.6: Context-aware action generation
- **Precondition:** User has ATS score 45
- **Steps:**
  1. View daily actions
- **Expected:** "Improve your resume" appears as HIGH priority action (ATS < 60 trigger).

---

## 16. Opportunity Alerts

### TC-16.1: High match alert
- **Precondition:** Auto-apply found job with 90% match
- **Steps:**
  1. `scanOpportunities(userId)` runs
- **Expected:** High-match alert created. Shows on dashboard with action link.

### TC-16.2: Low competition alert
- **Precondition:** Job with <50% average applicant count
- **Steps:**
  1. Opportunity scan detects it
- **Expected:** Alert: "Low competition — apply now!" with job link.

### TC-16.3: Recruiter interest alert
- **Precondition:** Recruiter sent push notification to user
- **Steps:**
  1. Opportunity scan detects unread push
- **Expected:** Alert: "A recruiter is interested in you!" with action link.

### TC-16.4: Dismiss alert
- **Steps:**
  1. Click "Dismiss" on an alert
- **Expected:** Alert marked dismissed. Removed from active alerts list.

### TC-16.5: Alert expiration
- **Precondition:** Alert with 3-day expiry, created 4 days ago
- **Steps:**
  1. Load active alerts
- **Expected:** Expired alert not returned.

### TC-16.6: Deduplication
- **Steps:**
  1. Two scans find same high-match job
- **Expected:** Only 1 alert created. Second scan skips duplicate.

---

## 17. Candidate Boost & Ranking

### TC-17.1: Activate boost (Pro)
- **Precondition:** Pro plan
- **Steps:**
  1. POST /api/candidate-boost
- **Expected:** is_boosted=true. boost_multiplier=2.0. boost_expires_at = now+7 days.

### TC-17.2: Premium boost (2.5x)
- **Precondition:** Premium plan
- **Steps:**
  1. Activate boost
- **Expected:** boost_multiplier=2.5.

### TC-17.3: Free plan blocked
- **Steps:**
  1. Free user attempts boost
- **Expected:** 403: "Pro or Premium required."

### TC-17.4: Boost auto-expiry
- **Precondition:** Boost activated 8 days ago (7-day duration)
- **Steps:**
  1. Any call to checkBoostStatus
- **Expected:** is_boosted=false. boost_multiplier=1.0.

### TC-17.5: Rank score calculation
- **Steps:**
  1. User has: profile_strength=80, ATS=75, 15 skills, 20 activities (30 days)
- **Expected:**
  - Profile: 80 * 0.25 = 20
  - ATS: 75 * 0.30 = 22.5
  - Skills: (15/30)*100 * 0.25 = 12.5
  - Activity: (20/50)*100 * 0.20 = 8
  - Total: 63.0 (before boost)

### TC-17.6: Rank with boost
- **Steps:**
  1. Same user with 2x boost active
- **Expected:** 63.0 * 2.0 = 126 → capped at 100.

### TC-17.7: Top candidates list
- **Steps:**
  1. Recruiter views /recruiter/top-candidates
- **Expected:** Candidates sorted by rank_score desc. Boosted candidates highlighted. Skills shown. ATS score shown.

---

## 18. Skill Demand Dashboard

### TC-18.1: View skill demand
- **Steps:**
  1. Navigate to `/skill-demand`
- **Expected:** Sections: Your Skills, Most In Demand, Trending, Highest Paying, Declining. Each skill shows demand/supply/trend/salary.

### TC-18.2: User skill analysis
- **Precondition:** User has "React" and "Python" in candidate_skills
- **Steps:**
  1. View "Your Skills in Market" section
- **Expected:** React and Python shown with their demand data. Status colored (hot/growing/stable/declining/oversaturated).

### TC-18.3: No user skills
- **Precondition:** No candidate_skills for user
- **Steps:**
  1. View skill demand
- **Expected:** "Your Skills" section empty or shows prompt to add skills.

### TC-18.4: Skill demand refresh (cron)
- **Steps:**
  1. Trigger cron
- **Expected:** `refreshSkillDemand()` aggregates from job_postings (demand) and candidate_skills (supply). Trends calculated from previous month. Data upserted.

---

## 19. Salary Intelligence

### TC-19.1: Search salary by title
- **Steps:**
  1. Enter "React Developer"
  2. Click search
- **Expected:** Salary range (min/avg/max), percentiles (p25/p50/p75), trend, comparable roles.

### TC-19.2: With location filter
- **Steps:**
  1. Search "React Developer" in "Bangalore"
- **Expected:** Location-specific salary data.

### TC-19.3: No data for title
- **Steps:**
  1. Search very obscure title
- **Expected:** Graceful empty state. No crash.

### TC-19.4: Trend indicators
- **Steps:**
  1. Search role with rising salaries
- **Expected:** Trend shows "Rising" with green arrow. Percentage change shown.

---

## 20. Resume Performance Index

### TC-20.1: View performance with multiple resumes
- **Precondition:** 3 resume versions with applications
- **Steps:**
  1. Navigate to `/resume-performance`
- **Expected:** Per-resume metrics (apps, interviews, offers, rejection rate). Best resume highlighted.

### TC-20.2: Hiring benchmark
- **Steps:**
  1. View benchmark section
- **Expected:** Percentile ranking (e.g., "Stronger than 72% of candidates"). Your score vs platform average.

### TC-20.3: Score threshold insight
- **Precondition:** User has applications with various match scores
- **Steps:**
  1. View insights
- **Expected:** "Jobs above 80% match = 3x interview rate" type insights.

### TC-20.4: Share benchmark
- **Steps:**
  1. Click "Share Benchmark"
- **Expected:** Shareable link generated. Token stored. Link copyable.

---

## 21. Candidate Competition

### TC-21.1: Overall competition
- **Steps:**
  1. View competition data
- **Expected:** Rank percentile, total jobs applied, strongest skill, competitive advantage text.

### TC-21.2: Per-job competition
- **Precondition:** User applied to job with 15 other applicants, user score 75
- **Steps:**
  1. View job competition
- **Expected:** "You rank #X out of 16 applicants". Percentile shown. Competition level: medium.

### TC-21.3: First applicant
- **Precondition:** No other applicants for job
- **Steps:**
  1. View competition
- **Expected:** Rank #1, percentile 100%. Insight: "First applicant — gets more attention!"

### TC-21.4: High competition job
- **Precondition:** 60+ applicants
- **Steps:**
  1. View competition
- **Expected:** Competition level: very_high. Insight: "High competition — apply quickly."

---

## 22. Hiring Prediction

### TC-22.1: Predict with good skill match
- **Steps:**
  1. POST with candidate_skills matching 80% of job_skills
- **Expected:** High skill_match_score (80+). Probability likely above 60.

### TC-22.2: Overqualified candidate
- **Steps:**
  1. POST with experience_years=15, required_experience=5
- **Expected:** experience_fit reduced to 80 (overqualified penalty).

### TC-22.3: Historical data filtering by title
- **Precondition:** hiring_outcomes has data for "Frontend Developer" jobs
- **Steps:**
  1. Predict for job_title "Senior Frontend Developer"
- **Expected:** Historical outcomes filtered by title keywords ("frontend", "developer"). Only relevant outcomes used for historical_success_rate.

### TC-22.4: Insufficient historical data
- **Precondition:** <5 relevant outcomes in hiring_outcomes
- **Steps:**
  1. Predict for niche role
- **Expected:** Falls back to all outcomes (not title-filtered). Confidence: "low".

### TC-22.5: Recommendations generated
- **Steps:**
  1. Predict with low skill match
- **Expected:** Recommendation: "Add missing skills: TypeScript, Docker, Kubernetes" (up to 3 missing skills).

### TC-22.6: Record hiring outcome
- **Steps:**
  1. POST to recordHiringOutcome with was_hired=true
- **Expected:** Row inserted in hiring_outcomes. Future predictions use this data.

---

## 23. Shareable Results

### TC-23.1: Create shareable ATS score
- **Steps:**
  1. POST /api/share-result { type: "ats_score", data: { score: 82, ... } }
- **Expected:** 32-char hex token generated. Stored in notifications.data. URL returned.

### TC-23.2: View shared result (public)
- **Steps:**
  1. Open /results/{token} without authentication
- **Expected:** Score card rendered. No auth required. OG meta tags set for social sharing.

### TC-23.3: Invalid token
- **Steps:**
  1. Open /results/invalid-token-here
- **Expected:** 404 or "Result not found" message.

### TC-23.4: Share multiple types
- **Steps:**
  1. Share ATS score
  2. Share interview probability
  3. Share hiring benchmark
- **Expected:** Each generates unique token. Each renders differently based on type.

---

## 24. Notifications System

### TC-24.1: Notification on auto-apply complete
- **Precondition:** Auto-apply run finishes
- **Steps:**
  1. Check notifications
- **Expected:** Notification with type "auto_apply", title about completion, job count.

### TC-24.2: Realtime delivery
- **Steps:**
  1. Open dashboard in browser
  2. Trigger notification from another source (e.g., recruiter sends message)
- **Expected:** Notification appears immediately via Supabase Realtime. Toast popup shows. Badge count increments.

### TC-24.3: Polling fallback
- **Precondition:** Realtime connection fails
- **Steps:**
  1. Wait 60 seconds
- **Expected:** Polling fetches new notifications. Same content, just delayed.

### TC-24.4: Mark single notification read
- **Steps:**
  1. Click on notification
- **Expected:** PATCH /api/notifications { id: notif_id }. Read=true. Badge count decrements.

### TC-24.5: Mark all read
- **Steps:**
  1. Click "Mark all read"
- **Expected:** All notifications updated to read=true. Badge shows 0.

### TC-24.6: Notification bell badge count
- **Steps:**
  1. Receive 5 unread notifications
- **Expected:** Badge shows "5". Animated pulse indicator.

---

## 25. Public Profiles

### TC-25.1: Enable public profile
- **Steps:**
  1. PATCH /api/profile { profile_visible: true }
- **Expected:** public_slug generated (name-based with random suffix). Profile visible at /u/{slug}.

### TC-25.2: View public profile
- **Steps:**
  1. Open /u/{slug} (no auth)
- **Expected:** Name, headline, bio, profile strength bar, ATS score, skill badges. Signup CTA.

### TC-25.3: Profile strength calculation
- **Precondition:** User has name, headline, bio, 5+ skills, resume with ATS 70+
- **Steps:**
  1. Check profile strength
- **Expected:** High score (80+). Name=15, headline=15, bio=15, avatar=10, skills(5+)=15, resume=15, ATS(60+)=15.

### TC-25.4: Private profile
- **Steps:**
  1. Set profile_visible=false
  2. Open /u/{slug}
- **Expected:** 404 or "Profile not found."

---

## 26. SEO Pages

### TC-26.1: Skills page loads (public)
- **Steps:**
  1. Open /skills without auth
- **Expected:** "Top Skills to Get Hired in 2026". Skills listed with demand data. SEO meta tags present.

### TC-26.2: Salary page loads (public)
- **Steps:**
  1. Open /salary without auth
- **Expected:** "Highest Paying Tech Roles 2026". Salary table with ranges.

### TC-26.3: SEO metadata
- **Steps:**
  1. Check page source of /skills
- **Expected:** Title tag, description meta, OG tags (og:title, og:description, og:image).

### TC-26.4: Job page with JSON-LD
- **Steps:**
  1. Open /jobs/{slug}
- **Expected:** JSON-LD script tag with `@type: "JobPosting"` structured data.

---

## 27. Recruiter: Job Posting

### TC-27.1: Create job posting
- **Precondition:** Recruiter role
- **Steps:**
  1. Navigate to /recruiter/jobs/new
  2. Fill title, description, skills, salary, location
  3. Save
- **Expected:** Job created in job_postings. Status: "draft" or "active".

### TC-27.2: AI generate description
- **Steps:**
  1. Enter title: "Senior React Developer"
  2. Click "Generate with AI"
- **Expected:** AI generates full job description with requirements, responsibilities, qualifications.

### TC-27.3: Optimize existing job
- **Steps:**
  1. Open existing job
  2. Click "Optimize"
- **Expected:** AI analyzes posting. Returns suggestions, optimized title/description, optimization score.

### TC-27.4: Toggle job status
- **Steps:**
  1. Pause an active job
- **Expected:** Status changed to "paused". No longer appears in public job listings.

### TC-27.5: Delete job
- **Steps:**
  1. Delete a job posting
- **Expected:** Job removed. Associated applications remain (for history).

---

## 28. Recruiter: Candidate Search & ATS

### TC-28.1: Search candidates by skills
- **Steps:**
  1. Search for candidates with "React" + "TypeScript"
- **Expected:** Candidates with matching skills returned. Ranked by relevance.

### TC-28.2: AI screening
- **Steps:**
  1. Select an application
  2. Click "AI Screen"
- **Expected:** AI evaluates resume vs job requirements. Returns match_score, strengths, gaps, recommendation. Saved to ai_screening JSONB.

### TC-28.3: Update application stage
- **Steps:**
  1. Move application from "Applied" to "Shortlisted"
- **Expected:** Stage updated. Updated_at trigger fires.

### TC-28.4: Schedule interview
- **Steps:**
  1. Click "Schedule Interview"
  2. Set date/time
- **Expected:** Stage → "interview_scheduled". Interview date saved. Candidate notified.

### TC-28.5: Similar candidates
- **Steps:**
  1. View candidate profile
  2. Click "Find Similar"
- **Expected:** Jaccard similarity on candidate_skills. Top 10 similar candidates with common skills and similarity score.

---

## 29. Recruiter: Instant Shortlist

### TC-29.1: Get shortlist for job
- **Steps:**
  1. Select existing job posting
  2. Click "Find Candidates"
- **Expected:** Instant results (no AI call, JS scoring). Candidates ranked by composite score. Matched/missing skills shown.

### TC-29.2: Score breakdown (trust layer)
- **Steps:**
  1. Expand score for a candidate
- **Expected:** Shows: skill_overlap 50%, profile_strength 20%, rank_score 20%, boost_bonus 10%. Each factor with actual value.

### TC-29.3: Reach out to candidate
- **Steps:**
  1. Click "Reach Out" on a candidate
- **Expected:** Push notification sent (push_type: "shortlisted"). Candidate receives notification.

### TC-29.4: Message All bulk outreach
- **Steps:**
  1. Click "Message All" for top 5
- **Expected:** Push sent to each candidate. Rate limit: 10/day per recruiter. If >10 candidates, some skipped.

### TC-29.5: No matching candidates
- **Precondition:** Very niche skills no candidate has
- **Steps:**
  1. Search
- **Expected:** Empty results with message "No candidates found."

### TC-29.6: Boosted candidate priority
- **Precondition:** Candidate A (unboosted, good skills) and Candidate B (boosted, slightly fewer skills)
- **Steps:**
  1. Get shortlist
- **Expected:** Boost adds 10% bonus. Candidate B may rank higher if boost compensates skill gap.

---

## 30. Recruiter: Messaging

Shared inbox UI (**`MessagesInbox`**) for recruiters at **`/recruiter/messages`** and job seekers at **`/messages`**. **API:** **`GET`/`POST /api/messages`** (canonical; **`GET`** supports **`limit`**, **`before`**, **`unread`**); **`GET /api/messages/thread`** (peer thread + pagination); **`GET /api/messages/unread-summary`** (**`{ counts }`** per sender); **`POST /api/messages/attachment`** (multipart **`file`**); **`GET`/`POST /api/recruiter/messages`** re-exports the same **`GET`/`POST`** handlers; **`POST /api/messages/mark-read`** with **`{ peer_id }`** sets **`is_read`** and **`read_at`** on inbound rows from that peer when a thread is opened.

### TC-30.1: Send message (recruiter → candidate)
- **Steps:**
  1. As recruiter, open **`/recruiter/messages`**, compose a message to a **job seeker** user id (e.g. from candidate search / profile).
  2. Send.
- **Expected:** **`POST /api/messages`** returns **201**; row inserted in **`messages`**. Recipient must be **`job_seeker`** or API returns **403** (see TC-30.8). With **`SUPABASE_SERVICE_ROLE_KEY`** set on the server, a **`notifications`** row is inserted for the **`receiver_id`** (**`type`** = **`message`**); without the service role key, the message still sends but the in-app bell notification is skipped (dev console warning).

### TC-30.2: Use template
- **Steps:**
  1. Select "Interview Invite" template
  2. Customize and send
- **Expected:** Template content pre-filled. Template_name recorded.

### TC-30.3: Unread filter
- **Steps:**
  1. Filter messages by unread
- **Expected:** Only unread messages shown.

### TC-30.4: CRUD templates
- **Steps:**
  1. Create template
  2. Edit template
  3. Delete template
- **Expected:** Full CRUD works. Types: general, interview_invite, rejection, offer, follow_up.

### TC-30.5: Job seeker inbox
- **Steps:**
  1. As job seeker, open **`/messages`** (Sidebar → **Messages**).
  2. Confirm list + main panel load (conversation list, empty state or threads).
- **Expected:** Same inbox behavior as recruiter layout; **`GET /api/messages`** returns messages where the user is sender or receiver.

### TC-30.6: Compose deep link (`compose` + `receiver_id`)
- **Steps:**
  1. Visit **`/messages?compose=1&receiver_id=<recruiter UUID>`** (job seeker) or **`/recruiter/messages?compose=1&receiver_id=<job seeker UUID>`** (recruiter).
- **Expected:** Compose form opens; **Recipient user ID** field is prefilled; URL can be used from candidate profile **Message in app** or candidate list **Message**.

### TC-30.7: Thread deep link (`peer`) and mark read
- **Steps:**
  1. Open **`/messages?peer=<uuid>`** or **`/recruiter/messages?peer=<uuid>`** for an existing conversation partner.
  2. Observe network or server logs.
- **Expected:** Thread loads; **`POST /api/messages/mark-read`** runs with **`{ peer_id }`**; inbound messages from that peer become read.

### TC-30.8: API role validation on send (**403**)
- **Precondition:** Authenticated sender; **`receiver_id`** exists in **`users`**.
- **Steps:**
  1. As **recruiter**, **`POST /api/messages`** with **`receiver_id`** of another **recruiter** (or non-job_seeker).
  2. As **job seeker**, **`POST /api/messages`** with **`receiver_id`** of another **job seeker** (or non-recruiter).
- **Expected:** **403** JSON error: recruiter path — *"Recruiters can only message job seeker accounts."*; job seeker path — *"You can only message recruiter accounts."*

### TC-30.9: Candidate search row Message (recruiter)
- **Steps:**
  1. On **`/recruiter/candidates`**, click **Message** on a row (not only the profile link).
- **Expected:** Navigates to **`/recruiter/messages?compose=1&receiver_id=<that candidate’s user id>`**; compose opens without invalid nested links.

### TC-30.10: Copy user ID on candidate profile (recruiter)
- **Steps:**
  1. On **`/recruiter/candidates/[id]`**, use **Copy user ID** (or equivalent control).
- **Expected:** User UUID is copied to the clipboard; optional short “copied” feedback.

---

## 31. Recruiter: Intelligence Dashboard

### TC-31.1: View hiring metrics
- **Steps:**
  1. Navigate to /recruiter/analytics
- **Expected:** Avg time to hire, screening→interview rate, interview→offer rate, offer acceptance rate.

### TC-31.2: Pipeline health
- **Steps:**
  1. View pipeline breakdown
- **Expected:** Application counts by stage. Stale applications highlighted (7+ days in early stage).

### TC-31.3: Recommendations
- **Precondition:** 10 stale applications
- **Steps:**
  1. View recommendations
- **Expected:** "10 stale applications need attention."

---

## 32. Recruiter: Auto-Push

### TC-32.1: Daily auto-push runs
- **Steps:**
  1. Recruiter has active job posting with skills_required: ["React", "Node.js"]
  2. Cron trigger fires
- **Expected:** `autoPushCandidatesForJob` finds candidates with React or Node.js skills. Top 5 pushed. Push notifications created.

### TC-32.2: Deduplication
- **Steps:**
  1. Cron runs twice for same job
- **Expected:** Second run skips already-pushed candidates.

### TC-32.3: Rate limit (10/day)
- **Steps:**
  1. Recruiter has 3 jobs, each pushes 5 candidates
- **Expected:** First 10 pushed. 11th-15th skipped (rate limit).

---

## 33. AI Cache System

### TC-33.1: Cache miss → cache set
- **Steps:**
  1. Call cachedAiGenerate with new content
- **Expected:** AI called. Response stored in ai_cache with TTL. Hash = SHA-256 of content.

### TC-33.2: Cache hit
- **Steps:**
  1. Call cachedAiGenerate with same content
- **Expected:** No AI call. Cached response returned. Faster response time.

### TC-33.3: Cache expiry
- **Steps:**
  1. Cache entry expires (TTL passed)
  2. Same request
- **Expected:** Cache miss. AI called again. New entry stored.

### TC-33.4: Different features, same content
- **Steps:**
  1. Cache resume_analysis for text "X"
  2. Cache job_match for same text "X"
- **Expected:** Different cache keys (feature included in hash). Both stored separately.

### TC-33.5: Gemini to OpenAI fallback
- **Precondition:** Gemini API returns 429
- **Steps:**
  1. Make AI call
- **Expected:** Automatically falls back to OpenAI (gpt-4o-mini). Response cached normally.

---

## 34. Rate Limiting

### TC-34.1: Under limit
- **Steps:**
  1. Send 5 API requests within 1 minute
- **Expected:** All 5 succeed. Rate limit entries created in usage_logs.

### TC-34.2: At limit
- **Steps:**
  1. Send 10 requests within 1 minute
- **Expected:** All 10 succeed (limit is 10).

### TC-34.3: Over limit
- **Steps:**
  1. Send 11th request within same minute
- **Expected:** 429 response with retryAfterMs. Retry after delay succeeds.

### TC-34.4: Fail-open on DB error
- **Precondition:** Database temporarily unavailable
- **Steps:**
  1. Send API request
- **Expected:** Rate limit check fails open (allows request). No crash.

### TC-34.5: Sliding window
- **Steps:**
  1. Send 10 requests at t=0
  2. Wait 30 seconds
  3. Send 1 more request
- **Expected:** Blocked (still within 1-minute window). Wait until t=60, then allowed.

---

## 35. Cron Jobs

### TC-35.1: Full cron trigger
- **Steps:**
  1. POST /api/smart-apply/trigger with valid CRON_SECRET
- **Expected:** All 8 steps execute: smart rules, daily reports, platform stats, skill demand, auto-push, opportunity scan, stale `rate_limit` usage_logs cleanup, expired `ai_cache` cleanup. JSON response includes `cleanup.rate_limit_cleaned` and `cleanup.cache_cleaned`.

### TC-35.2: Invalid CRON_SECRET (production)
- **Precondition:** NODE_ENV=production
- **Steps:**
  1. POST with wrong secret
- **Expected:** 401: "Unauthorized."

### TC-35.3: Dev mode (no secret required)
- **Precondition:** NODE_ENV=development
- **Steps:**
  1. POST without Authorization header
- **Expected:** All tasks run (dev bypass).

### TC-35.4: Partial failure handling
- **Steps:**
  1. Smart apply throws error
  2. Other tasks should continue
- **Expected:** Each task wrapped in try/catch. Failed task logged. Other tasks proceed.

---

## 36. Cross-Feature Integration Tests

### TC-36.1: Full user journey (new user to first auto-apply)
- **Steps:**
  1. Sign up → verify email → login
  2. Upload resume → analyze (score 65)
  3. Improve resume → re-analyze (score 82)
  4. Start auto-apply → review 5 jobs → apply to 3
  5. Check streak (should be day 1, XP earned from analyze + improve + apply)
  6. Check career coach (should show status "new" with recommendations)
  7. Check notifications (auto-apply complete notification)
- **Expected:** Complete flow works end-to-end. Data consistent across all features.

### TC-36.2: Resume structuring cascades
- **Steps:**
  1. Upload resume
  2. Start auto-apply (triggers getOrCreateStructuredResume)
  3. Check candidate_skills populated
  4. Check skill_badges populated
  5. Recruiter searches by user's skills
- **Expected:** All three tables populated from single AI extraction. Recruiter can find candidate.

### TC-36.3: Streak reward → boost → recruiter visibility
- **Steps:**
  1. Maintain 14-day streak
  2. Profile boost activated (2x, 3 days)
  3. Recruiter views instant shortlist
- **Expected:** User's rank_score multiplied by 2x. Appears higher in recruiter shortlist.

### TC-36.4: Career coach + skill demand integration
- **Steps:**
  1. User has "React" skill
  2. Skill demand shows "React" as "hot"
  3. Career coach shows React in "highlight" category
- **Expected:** Career coach Skill ROI correctly cross-references skill_demand data.

### TC-36.5: Auto-apply → application tracker → analytics
- **Steps:**
  1. Auto-apply creates 3 applications
  2. Check /applications board
  3. Check /analytics funnel
- **Expected:** 3 applications visible in tracker (status: "applied"). Analytics funnel shows 3 in "Applied" column.

### TC-36.6: Recruiter push → candidate notification → opportunity alert
- **Steps:**
  1. Recruiter sends push to candidate
  2. Candidate checks notifications (bell shows push)
  3. Candidate checks opportunity alerts (recruiter interest alert)
- **Expected:** All three systems show the push event consistently.

### TC-36.7: Learning engine → interview score adjustment
- **Steps:**
  1. User applies to 20 jobs
  2. 15 with high skill overlap → 10 get interviews
  3. Learning engine detects: high skill overlap = high interview rate
  4. Check interview probability for new job
- **Expected:** skill_weight dynamically increased by learning engine. Interview probability for skill-matched jobs is higher.

### TC-36.8: Smart auto-apply → milestone → activity feed
- **Steps:**
  1. Smart auto-apply processes 5 jobs (reaching 10th total application)
  2. Milestone: "10 Applications" logged
- **Expected:** Activity feed shows milestone entry. is_public=true. Visible in community feed.

### TC-36.9: Cached AI reduces cost
- **Steps:**
  1. User A analyzes resume text "X" (AI called, cached)
  2. User B analyzes identical resume text "X"
- **Expected:** User B gets cached response. No second AI API call. Same score returned.

### TC-36.10: Usage limits across features
- **Steps:**
  1. Free user: use 3 resume analyses, 3 job matches, 1 cover letter, 1 job finder, 2 auto-applies
  2. Attempt any additional feature use
- **Expected:** All blocked with appropriate "limit reached" messages. Upgrade prompt for each.

---

## 37. Security & Authorization

### TC-37.1: RLS prevents cross-user data access
- **Steps:**
  1. User A creates resume
  2. User B tries to access User A's resume via API
- **Expected:** RLS blocks access. Empty result or 404.

### TC-37.2: resume_analysis RLS (no user_id column)
- **Steps:**
  1. User A has resume_analysis
  2. User B tries to read it
- **Expected:** RLS policy uses EXISTS join through resumes table. Only user A can access.

### TC-37.3: Recruiter can't access job seeker routes
- **Steps:**
  1. Recruiter tries to access /api/career-coach
- **Expected:** Allowed (API checks role only for recruiter-specific routes). Career coach returns empty data for recruiter.

### TC-37.4: Job seeker can't access recruiter routes
- **Steps:**
  1. Job seeker calls /api/recruiter/jobs
- **Expected:** Filtered by recruiter_id. Returns empty (no jobs for this user as recruiter).

### TC-37.5: XSS prevention
- **Steps:**
  1. Submit resume with `<script>alert('xss')</script>` in text
  2. View resume analysis result
- **Expected:** Script tags escaped in output. No XSS execution.

### TC-37.6: Open redirect prevention
- **Steps:**
  1. Login with `next=//evil.com`
- **Expected:** `sanitizeRedirectPath` rejects `//` prefix. Redirects to safe default.

### TC-37.7: UUID validation
- **Steps:**
  1. Call /api/resume-analysis/not-a-uuid
- **Expected:** `isValidUUID` fails. 400: "Invalid ID."

### TC-37.8: Rate limit prevents abuse
- **Steps:**
  1. Script sends 100 requests in 1 minute
- **Expected:** First 10 succeed. Remaining 90 get 429.

### TC-37.9: Push rate limit
- **Steps:**
  1. Recruiter sends 11 pushes in a day
- **Expected:** 11th push rejected: "Daily push limit reached."

### TC-37.10: CRON_SECRET protection
- **Steps:**
  1. In production, call /api/smart-apply/trigger without secret
- **Expected:** 401 Unauthorized.

---

## 38. Database Integrity

### TC-38.1: Grants file covers all tables
- **Steps:**
  1. Compare tables in migrations with GRANT statements in grants.sql
- **Expected:** Every table has corresponding GRANT for anon and authenticated roles.

### TC-38.2: Unique constraints prevent duplicates
- **Steps:**
  1. Try to insert duplicate (user_id, resume_id) in smart_apply_rules
- **Expected:** Upsert works. No duplicate row.

### TC-38.3: Candidate skills unique constraint
- **Steps:**
  1. Sync skills twice for same user
- **Expected:** UNIQUE(user_id, skill_normalized) prevents duplicates. Upsert updates existing.

### TC-38.4: Usage logs CHECK constraint
- **Steps:**
  1. Insert usage_log with feature="invalid_feature"
- **Expected:** CHECK constraint rejects. Valid values: resume_analysis, job_match, cover_letter, interview_prep, resume_improve, job_finder, auto_apply, smart_apply, rate_limit.

### TC-38.5: updated_at triggers
- **Steps:**
  1. Update an application
- **Expected:** updated_at column auto-set to now().

### TC-38.6: Cascade deletes
- **Steps:**
  1. Delete user from auth.users
- **Expected:** Related data handled by ON DELETE policies (SET NULL for hiring_outcomes, CASCADE where applicable).

### TC-38.7: Skill demand unique (skill + month)
- **Steps:**
  1. Refresh skill demand twice in same month
- **Expected:** Second refresh upserts (updates existing rows, doesn't duplicate).

### TC-38.8: Auto-apply run status transitions
- **Steps:**
  1. Verify status transitions: pending → processing → ready_for_review → confirmed → completed
- **Expected:** Each transition valid. Can also go pending → processing → failed.

---

## Test Execution Checklist

### Smoke Tests (run after every deployment)
- [ ] TC-1.1: Login works
- [ ] TC-1.3: Protected routes redirect
- [ ] TC-2.1: Resume upload + analysis
- [ ] TC-8.1: Auto-apply full flow
- [ ] TC-14.1: Streak recording
- [ ] TC-24.1: Notifications appear
- [ ] TC-27.1: Recruiter job creation
- [ ] TC-29.1: Instant shortlist works

### Regression Tests (run after code changes)
- [ ] TC-2.8: AI cache hit works
- [ ] TC-8.7: Auto-apply timeout safety
- [ ] TC-14.7: Streak reward credits granted
- [ ] TC-14.11: Pro trial reverts on expiry
- [ ] TC-14.13: Permanent boost persists
- [ ] TC-22.3: Hiring prediction filters by title
- [ ] TC-33.5: Gemini→OpenAI fallback
- [ ] TC-37.1: RLS blocks cross-user access

### Load Tests (run before major launches)
- [ ] TC-34.3: Rate limiting under load
- [ ] TC-33.2: Cache performance under concurrent requests
- [ ] TC-8.5: Polling doesn't overload server
- [ ] TC-35.1: Cron completes within timeout

### Security Tests (run periodically)
- [ ] TC-37.5: XSS prevention
- [ ] TC-37.6: Open redirect prevention
- [ ] TC-37.8: Rate limit abuse prevention
- [ ] TC-37.10: CRON_SECRET enforcement

---

## 39. Google OAuth Authentication (Phase 9)

### TC-39.1: Google OAuth Signup
- [ ] Click "Continue with Google" on signup page
- [ ] Google consent screen appears
- [ ] After consent, user is redirected to /auth/callback
- [ ] User row created in database with correct role
- [ ] Redirected to /onboarding (job seeker) or /recruiter (recruiter)

### TC-39.2: Google OAuth Login
- [ ] Click "Continue with Google" on login page
- [ ] Existing Google user authenticated successfully
- [ ] Redirected to ?next param or /dashboard

### TC-39.3: Role Selection on Signup
- [ ] Default role is "Job Seeker" (pre-selected)
- [ ] Click "Recruiter" toggles selection with visual indicator
- [ ] Selected role passed as ?role= param in redirect URL
- [ ] Auth callback sets role in users table
- [ ] Role persists after login

### TC-39.4: Trust Signals Display
- [ ] Signup page shows 3 trust signals below form
- [ ] Login page shows 3 trust signals below form
- [ ] Signals show: "3.2x more interviews", "10,000+ users", "Secure & private"
- [ ] Icons render correctly (TrendingUp, Users, Shield)

### TC-39.5: Email/Password Still Works
- [ ] Email signup still works with role selection
- [ ] Email login still works
- [ ] Error messages display correctly
- [ ] Both buttons disabled during loading

## 40. Onboarding Flow (Phase 9)

### TC-40.1: Step 1 — Upload Resume
- [ ] Page loads at /onboarding with step indicator
- [ ] File upload accepts .txt, .pdf, .doc, .docx
- [ ] Paste textarea works (min 50 chars required)
- [ ] "Analyze My Resume" button disabled when text < 50 chars
- [ ] "Skip for now" navigates to /dashboard
- [ ] Progress bar shows 0% at step 1

### TC-40.2: Step 2 — See Score
- [ ] Loading spinner shown during analysis
- [ ] ATS score displayed with correct color (green ≥80, yellow ≥60, red <60)
- [ ] ProgressBar shows score visually
- [ ] Missing skills shown as red badges
- [ ] Top improvements shown as numbered list
- [ ] [Continue] goes to step 3
- [ ] [Improve My Resume First] goes to /resume-analyzer
- [ ] Progress bar shows 50% at step 2

### TC-40.3: Step 3 — Start Applying
- [ ] Success message "You're all set!" displayed
- [ ] Three action cards shown: Find Jobs, Auto-Apply, Improve Resume
- [ ] Each card navigates to correct page on click
- [ ] [Go to Dashboard] navigates to /dashboard
- [ ] Progress bar shows 100% at step 3

### TC-40.4: Onboarding Protected
- [ ] /onboarding redirects to /login if not authenticated
- [ ] Middleware includes /onboarding in protected routes

## 41. Demo Mode (Phase 9)

### TC-41.1: Demo Page Access
- [ ] /demo loads without authentication
- [ ] Header shows logo, Log in, Sign Up Free
- [ ] No sidebar or dashboard layout

### TC-41.2: Demo Analysis
- [ ] Textarea accepts resume text
- [ ] "Check My Score" disabled when text < 50 chars
- [ ] 2-second loading animation shown
- [ ] Score displayed between 40-85 range
- [ ] Score color-coded correctly
- [ ] No actual API call made (client-side only)

### TC-41.3: Demo Results Lock
- [ ] Full analysis section is blurred/locked
- [ ] Lock icon and "Sign up to unlock" overlay shown
- [ ] "Unlock Full Report (Free)" links to /signup
- [ ] "Try Again" resets the form
- [ ] Blurred content shows placeholder skills/improvements

## 42. Feedback System (Phase 9)

### TC-42.1: Feedback Buttons Display
- [ ] FeedbackButtons shown on ResumeAnalysisResult
- [ ] FeedbackButtons shown on MatchResult
- [ ] FeedbackButtons shown on CoverLetterResult
- [ ] Shows "Was this helpful?" with thumbs up/down

### TC-42.2: Feedback Submission
- [ ] Click thumbs up → shows "Thanks for the feedback!"
- [ ] Click thumbs down → shows "We'll improve this. Thanks!"
- [ ] POST /api/feedback called with correct feature and type
- [ ] Only one feedback per result (buttons disappear after click)

### TC-42.3: Share Score Buttons
- [ ] ShareScoreButton shown on ResumeAnalysisResult
- [ ] ShareScoreButton shown on MatchResult
- [ ] Mobile: native share dialog opens
- [ ] Desktop: clipboard copy with "Copied!" confirmation
- [ ] Share text includes score and app name

## 43. Smart Upgrade Triggers (Phase 9)

### TC-43.1: Upgrade Banner Display
- [ ] Banner hidden when remaining uses > 1
- [ ] Amber banner when only 1 use remaining
- [ ] Red banner when 0 uses remaining
- [ ] Banner shows feature name and count
- [ ] "Upgrade to Pro" button links to /pricing

### TC-43.2: Usage Tracking in Response
- [ ] /api/analyze-resume response includes `_usage: { used, limit }`
- [ ] Frontend reads _usage and shows UpgradeBanner
- [ ] Pro/Premium users: no banner (limit: -1)

## 44. Sidebar Navigation Groups (Phase 9)

### TC-44.1: Group Labels
- [ ] "APPLY" section header visible
- [ ] "IMPROVE" section header visible
- [ ] "INSIGHTS" section header visible
- [ ] Dashboard has no group label (standalone)
- [ ] History/Pricing/Settings have no group label

### TC-44.2: Navigation Functionality
- [ ] All 22 navigation links work correctly
- [ ] Active page highlighted with primary color
- [ ] Mobile: sidebar closes on link click
- [ ] Mobile: sidebar closes on Escape key
- [ ] "Switch to Recruiter" link at bottom works

## 45. Notification Copy Improvements (Phase 9)

### TC-45.1: Auto-Apply Notifications
- [ ] After auto-apply confirm: notification title includes count (e.g. "N new application(s) sent!")
- [ ] Message includes "Your next interview could be around the corner!"

### TC-45.2: Smart Apply Notifications
- [ ] After smart apply: title shows "X high-match jobs found for you today!"
- [ ] Message includes "Smart Apply just applied to X jobs while you were away"

### TC-45.3: Daily Report Notification
- [ ] Title shows "Your daily career update is ready!"

## 46. Empty State Improvements (Phase 9)

### TC-46.1: ActivityList Empty State
- [ ] Shows "No activity yet. Here's how to get started:"
- [ ] 3 action cards displayed: Analyze Resume, Find Jobs, Cover Letter
- [ ] Each card links to correct page
- [ ] Cards have icons, titles, and descriptions
- [ ] Cards show hover state with border color change

## 47. Landing Page Role Tabs (Phase 9)

### TC-47.1: Tab Toggle
- [ ] Landing page loads with "Job Seeker" tab active by default
- [ ] Clicking "I'm a Recruiter" switches all content to recruiter-focused
- [ ] Clicking "I'm a Job Seeker" switches back to job seeker content
- [ ] Tab toggle has visual active state (filled background, bold text)
- [ ] Inactive tab shows muted styling with hover effect

### TC-47.2: Job Seeker Tab Content
- [ ] Hero shows "Get 3x More Interviews Using AI"
- [ ] 3-step flow displays: Upload Resume → Get ATS Score → Auto-Apply
- [ ] Interview probability preview card renders with sample factors
- [ ] Streak rewards section shows levels and XP
- [ ] All CTAs link to `/signup?role=job_seeker`

### TC-47.3: Recruiter Tab Content
- [ ] Hero shows "Top 10 Candidates In 5 Seconds"
- [ ] 3-step flow displays: Post Your Job → AI Shortlists → Hire Fast
- [ ] Recruiter tools grid shows 4 cards (AI Screening, ATS Pipeline, Smart Alerts, Salary Intelligence)
- [ ] Candidate preview card renders with sample skills/scores
- [ ] All CTAs link to `/signup?role=recruiter`

### TC-47.4: Shared Sections
- [ ] Pricing section renders for both tabs
- [ ] Career intelligence links (Skills, Salary, Jobs) visible for both tabs
- [ ] Footer renders for both tabs

### TC-47.5: Signup Role Pre-selection
- [ ] Navigating to `/signup?role=job_seeker` pre-selects Job Seeker toggle
- [ ] Navigating to `/signup?role=recruiter` pre-selects Recruiter toggle
- [ ] Navigating to `/signup` (no param) defaults to Job Seeker
- [ ] Navigating to `/signup?role=invalid` defaults to Job Seeker
- [ ] Pre-selected role is used in Google OAuth redirectTo URL
- [ ] Pre-selected role is used in email signup emailRedirectTo URL
- [ ] User can still change role after pre-selection before submitting

## 48. QA Cross-Verification Fixes (Phase 9.1)

### TC-48.1: Google OAuth Error Handling
- [ ] When Google provider not enabled in Supabase, clicking "Continue with Google" on signup shows: "Google sign-in is not configured yet. Please use email signup instead."
- [ ] When Google provider not enabled in Supabase, clicking "Continue with Google" on login shows: "Google sign-in is not configured yet. Please use email login instead."
- [ ] Error message does NOT show raw Supabase error like "Unsupported provider: provider is not enabled"
- [ ] When Google provider IS enabled, OAuth flow works correctly (redirect to Google, callback, redirect to /onboarding or /recruiter)

### TC-48.2: URL Encoding in OAuth Redirects
- [ ] Signup Google OAuth `redirectTo` URL properly encodes the `next` param with `encodeURIComponent()`
- [ ] Signup email `emailRedirectTo` URL properly encodes the `next` param
- [ ] Auth callback correctly parses `?next=` and `?role=` from URL

### TC-48.3: SuccessAnimation Stability
- [ ] SuccessAnimation does NOT re-trigger when parent component re-renders
- [ ] SuccessAnimation shows for specified duration then calls `onDone` exactly once
- [ ] Passing inline `onDone={() => ...}` does NOT cause infinite loop

### TC-48.4: Onboarding File Upload
- [ ] File input only accepts `.txt` files (not PDF/DOC which produce garbage text)
- [ ] Upload label says "TXT file (or paste text below)"
- [ ] Pasting resume text directly works correctly
- [ ] Resume text is analyzed via `/api/analyze-resume` and score displays

### TC-48.5: ShareScoreButton Consistency
- [ ] On devices with `navigator.share`, uses native share dialog
- [ ] On devices without `navigator.share`, shows "Copy to clipboard" option
- [ ] No TypeScript or runtime errors on SSR (typeof navigator check)

---

## 49. Dashboard, history, jobs applied, and public APIs

### TC-49.1: GET /api/dashboard
- **Precondition:** Authenticated job seeker
- **Steps:** Call `GET /api/dashboard`
- **Expected:** 200 JSON with `analyses`, `matches`, `coverLetters`, `applicationCount`, `avgMatchScore`, `usage`, `userName`, `planType`. Matches TanStack `useDashboardStats` shape.

### TC-49.2: GET /api/history
- **Steps:** Call `GET /api/history`
- **Expected:** 200 with `analyses`, `matches`, `coverLetters`, `improvedResumes` arrays (max 50 each).

### TC-49.3: GET /api/upload-resume (list)
- **Steps:** Call `GET /api/upload-resume` with session
- **Expected:** 200 with array of `{ id, file_name, file_url, created_at }` for owned resumes.

### TC-49.4: GET /api/jobs/applied
- **Precondition:** User has applied to at least one recruiter job
- **Steps:** Call `GET /api/jobs/applied`
- **Expected:** 200 JSON array of `job_id` strings. No auth returns `[]` with 200 (fail-open for anonymous).

### TC-49.5: POST /api/public/extract-resume
- **Precondition:** No authentication
- **Steps:** Multipart POST with valid PDF under 4MB
- **Expected:** 200 with extracted `text` field. No session cookie required.

### TC-49.6: POST /api/public/fresher-resume
- **Precondition:** No authentication; valid JSON body (desired role, education, skills, projects within limits)
- **Expected:** 200 with `resumeText` and `atsScore` (0–100). Uses AI cache where applicable.

### TC-49.7: POST /api/opportunity-alerts/scan
- **Precondition:** Authenticated user (uses `supabase.auth.getUser()` in route)
- **Steps:** POST `/api/opportunity-alerts/scan`
- **Expected:** 200 JSON `{ scanned: true, alertsCreated: <number> }`. 401 without session.

---

## 50. AI Usage Tracking & Credits

### TC-50.1: Migration applied (schema)
- **Steps:**
  1. Verify `public.ai_usage` exists
  2. Verify `users.total_credits`, `users.used_credits` exist
- **Expected:** Table/columns available and queryable.

### TC-50.2: Grants + RLS baseline
- **Steps:**
  1. As authenticated app user, call `/api/usage/summary`
  2. Confirm no `permission denied` error
- **Expected:** Authenticated role can `SELECT`/`INSERT` on `ai_usage` (with RLS row scoping).

### TC-50.3: Usage insert on ATS analyze
- **Steps:**
  1. Run `POST /api/analyze-resume` successfully
  2. Check `/api/usage/history?limit=10`
- **Expected:** New row appears with `feature_name = resume_analysis`, non-negative token/credit values.

### TC-50.4: Usage insert on improve resume
- **Steps:**
  1. Run `POST /api/improve-resume`
  2. Check `/api/usage/feature-breakdown`
- **Expected:** `resume_improve` (or relevant feature key) increases in calls/tokens/credits.

### TC-50.5: Cover letter generation diagnostics
- **Steps:**
  1. Trigger cover letter generation failure
  2. Inspect API JSON
- **Expected:** 500 payload includes `detail` (no generic-only error), enabling root-cause debugging.

### TC-50.6: Summary aggregation correctness
- **Steps:**
  1. Perform 2-3 distinct AI actions
  2. Compare totals in `/api/usage/summary` with `/api/usage/history`
- **Expected:** `totalTokens` and `totalCredits` reflect sum of history rows for current user.

### TC-50.7: Credit enforcement OFF
- **Precondition:** `AI_CREDITS_ENFORCEMENT_ENABLED=false`
- **Steps:**
  1. Set `used_credits >= total_credits`
  2. Run an AI endpoint
- **Expected:** Request still executes (tracking continues), no `CREDITS_EXHAUSTED`.

### TC-50.8: Credit enforcement ON
- **Precondition:** `AI_CREDITS_ENFORCEMENT_ENABLED=true`
- **Steps:**
  1. Set `used_credits >= total_credits`
  2. Run ATS / improve / recruiter AI endpoint
- **Expected:** API returns HTTP 402 with `{ error: "CREDITS_EXHAUSTED", message: ... }`.

### TC-50.9: UI exhaustion handling
- **Steps:**
  1. Trigger `CREDITS_EXHAUSTED` on jobseeker and recruiter pages
- **Expected:** UI renders `AICreditExhaustedAlert` upgrade CTA; no raw code/error dumps.

### TC-50.10: Usage dashboard navigation and rendering
- **Steps:**
  1. Open sidebar and click `AI Usage`
  2. Verify `/usage` page loads
- **Expected:** Summary cards, breakdown, and history sections render; non-empty after AI actions.

### TC-50.11: Usage API failure observability
- **Steps:**
  1. Temporarily break usage query path (e.g., permission/table issue in test env)
  2. Call `/api/usage/summary`
- **Expected:** API returns 500 with `detail`; server logs include `[usage-summary]` (or related tag).

### TC-50.12: Tracking write failure observability
- **Steps:**
  1. Force insert failure scenario in test env
  2. Execute AI call
- **Expected:** Server warning log appears (`[ai-usage] ... failed`), not silent drop.

---

## 51. Automated QA Regression Suite

### TC-51.1: Run critical job seeker E2E suite
- **Precondition:** Playwright Chromium installed, app starts on `PLAYWRIGHT_PORT`
- **Steps:**
  1. Run `npm run test:e2e:critical`
  2. Inspect `e2e/resume-flow.spec.ts` and `e2e/auto-apply.spec.ts` results
- **Expected:** Resume analyze/improve/re-analyze, auto-apply full/partial/retry, and credits exhaustion UX assertions pass.

### TC-51.2: Run critical recruiter E2E suite
- **Steps:**
  1. Run `npx playwright test e2e/recruiter-flow.spec.ts`
  2. Verify create/publish job, AI description generation, ATS analyze, shortlist partial, and messaging retry scenarios
- **Expected:** Recruiter reliability checkpoints pass with deterministic route mocks.

### TC-51.3: API contract suite
- **Steps:**
  1. Run `npm run test:api`
  2. Review `api-tests/contracts.api.spec.ts`
- **Expected:** Validation errors expose structured metadata (`requestId`, `retryable`, `nextAction` when applicable); success paths include meta envelope when available.

### TC-51.4: API data-integrity suite
- **Steps:**
  1. Run `npx playwright test api-tests/data-integrity.api.spec.ts`
  2. Check idempotent behavior around mark-read and auto-apply confirm contracts
- **Expected:** No server crash; idempotent semantics hold in seeded/non-seeded test envs.

### TC-51.5: Fixture and seeding determinism
- **Steps:**
  1. Run `node scripts/test/seed-fixtures.mjs`
  2. Apply generated SQL in test DB
  3. Re-run E2E/API suites
- **Expected:** Stable deterministic data across repeated CI/local test runs.
