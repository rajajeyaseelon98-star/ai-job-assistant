# AI Job Assistant — Features Flow & Functionality Document

**Purpose:** Step-by-step flow chart of every feature. Shows the data path from user action → frontend → API → lib → database → response for each feature.

**Last updated:** 2026-03-18

---

## Table of Contents

1. [Authentication & Onboarding](#1-authentication--onboarding)
2. [Resume Upload & ATS Analysis](#2-resume-upload--ats-analysis)
3. [Resume Improvement](#3-resume-improvement)
4. [Job Matching](#4-job-matching)
5. [Cover Letter Generation](#5-cover-letter-generation)
6. [Interview Preparation](#6-interview-preparation)
7. [Auto Job Finder](#7-auto-job-finder)
8. [AI Auto-Apply (Killer Feature)](#8-ai-auto-apply-killer-feature)
9. [Smart Auto-Apply (Set & Forget)](#9-smart-auto-apply-set--forget)
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
23. [Shareable Results & Viral Loop](#23-shareable-results--viral-loop)
24. [Notifications System](#24-notifications-system)
25. [Public Profiles](#25-public-profiles)
26. [SEO Pages (Data Moat)](#26-seo-pages-data-moat)
27. [Recruiter: Job Posting & Management](#27-recruiter-job-posting--management)
28. [Recruiter: Candidate Search & ATS Pipeline](#28-recruiter-candidate-search--ats-pipeline)
29. [Recruiter: Instant Shortlist](#29-recruiter-instant-shortlist)
30. [Recruiter: Messaging & Templates](#30-recruiter-messaging--templates)
31. [Recruiter: Intelligence Dashboard](#31-recruiter-intelligence-dashboard)
32. [Recruiter: Auto-Push System](#32-recruiter-auto-push-system)
33. [AI Cache System](#33-ai-cache-system)
34. [Rate Limiting](#34-rate-limiting)
35. [Cron Jobs (Unified Trigger)](#35-cron-jobs-unified-trigger)

---

## 1. Authentication & Onboarding

```
User visits app
    │
    ├─ Protected page? ──► middleware.ts checks Supabase session
    │   │
    │   ├─ No session ──► Redirect to /login?next={path}
    │   │
    │   └─ Has session ──► Email confirmed?
    │       │
    │       ├─ No ──► Redirect to /login?error=verify
    │       │
    │       └─ Yes ──► Allow access, continue to page
    │
    ├─ /login ──► Supabase Auth (email/password or OAuth)
    │   │
    │   └─ Success ──► /auth/callback/route.ts
    │       │
    │       ├─ exchangeCodeForSession(code)
    │       ├─ ensureUserRow(userId, email) ──► UPSERT into public.users
    │       │   (plan_type: "free", role: "job_seeker", ignoreDuplicates: true)
    │       └─ Redirect to sanitizeRedirectPath(next) or /dashboard
    │
    └─ /select-role ──► User picks job_seeker or recruiter
        │
        └─ PUT /api/user/role ──► Updates users.role
            │
            ├─ job_seeker ──► Redirect to /dashboard
            └─ recruiter ──► Redirect to /recruiter
```

**Key files:** `middleware.ts`, `app/auth/callback/route.ts`, `lib/auth.ts`, `lib/validation.ts`

---

## 2. Resume Upload & ATS Analysis

```
User visits /resume-analyzer
    │
    ├─ Option A: Upload PDF/DOCX (max 5MB)
    │   │
    │   └─ POST /api/upload-resume (multipart)
    │       │
    │       ├─ Parse text: pdf-parse (PDF) or mammoth (DOCX)
    │       ├─ Upload file to Supabase Storage
    │       ├─ INSERT into resumes (user_id, file_url, parsed_text)
    │       └─ Return { id, parsed_text }
    │
    ├─ Option B: Paste resume text directly
    │
    └─ Click "Analyze"
        │
        └─ POST /api/analyze-resume
            │
            ├─ checkRateLimit(userId) ──► 429 if exceeded
            ├─ canUseFeature("resume_analysis", planType) ──► 403 if over free limit
            ├─ cachedAiGenerate(ANALYSIS_PROMPT, resumeText)
            │   │
            │   ├─ generateCacheKey("resume_analysis", resumeText)
            │   ├─ getCachedResponse(hash) ──► Return cached if valid
            │   └─ On miss: AI call (Gemini → OpenAI fallback)
            │       │
            │       ├─ setCachedResponse(hash, result, "resume_analysis") [TTL: 7 days]
            │       └─ Return ATSAnalysisResult
            │
            ├─ If resumeId: INSERT into resume_analysis (resume_id, score, analysis_json)
            ├─ logUsage(userId, "resume_analysis")
            ├─ recordDailyActivity(userId, "resume_analyze") [streak + XP]
            └─ Return { atsScore, missingSkills, improvements, recommendedRoles }
                │
                └─ Frontend renders ResumeAnalysisResult component
                    │
                    ├─ Score gauge (0-100)
                    ├─ Missing skills list
                    ├─ Improvement suggestions
                    ├─ "Improve with AI" button ──► triggers Resume Improvement flow
                    └─ "Share Score" button ──► triggers Shareable Results flow
```

**Key files:** `app/(dashboard)/resume-analyzer/page.tsx`, `app/api/upload-resume/route.ts`, `app/api/analyze-resume/route.ts`, `lib/ai.ts`, `lib/aiCache.ts`, `lib/usage.ts`, `lib/rateLimit.ts`

---

## 3. Resume Improvement

```
User clicks "Improve with AI" (from resume analyzer or tailor page)
    │
    └─ POST /api/improve-resume
        │
        ├─ Body: { resumeText, resumeId?, jobTitle?, jobDescription?, previousAnalysis? }
        ├─ canUseFeature("resume_improve", planType) ──► Pro/Premium only
        ├─ cachedAiGenerate(IMPROVE_PROMPT, inputs)
        │   │
        │   └─ Returns ImprovedResumeContent:
        │       { summary, skills[], experience[], projects[], education[] }
        │
        ├─ INSERT into improved_resumes (user_id, resume_id, improved_content, job_title)
        ├─ logActivity(userId, "resume_improved", title, description)
        ├─ logUsage(userId, "resume_improve")
        └─ Return { ...content, improvedResumeId }
            │
            └─ Frontend renders ImprovedResumeView
                │
                ├─ Copy to clipboard (plaintext conversion)
                ├─ Download PDF (iframe + print())
                ├─ Download DOCX:
                │   ├─ If improvedResumeId: GET /api/improved-resumes/{id}/download?format=docx
                │   └─ Else: POST /api/improved-resumes/export-docx with content
                │       │
                │       └─ buildImprovedResumeDocx(content) ──► Buffer ──► .docx file
                │           (includes "Created with AI Job Assistant" watermark)
                │
                └─ "Re-analyze" button ──► POST /api/analyze-resume with recheckAfterImprovement=true
```

**Key files:** `app/api/improve-resume/route.ts`, `components/resume/ImprovedResumeView.tsx`, `lib/buildDocx.ts`

---

## 4. Job Matching

```
User visits /job-match
    │
    ├─ Input: Resume text + Job description + optional Job title
    │
    └─ POST /api/job-match
        │
        ├─ canUseFeature("job_match", planType)
        ├─ cachedAiGenerate(MATCH_PROMPT, { resume, job })
        │   └─ Returns: match_score, missing_skills, analysis
        │
        ├─ INSERT into job_matches (user_id, resume_id?, job_desc, match_score, analysis)
        ├─ logUsage(userId, "job_match")
        ├─ recordDailyActivity(userId, "job_match")
        └─ Return JobMatchResult
            │
            └─ Frontend renders MatchResult
                ├─ Match score circle (color-coded)
                ├─ Missing skills list
                └─ AI-generated analysis
```

**Key files:** `app/(dashboard)/job-match/page.tsx`, `app/api/job-match/route.ts`

---

## 5. Cover Letter Generation

```
User visits /cover-letter
    │
    ├─ Input: Company name, job title, job description, resume text
    │
    └─ POST /api/generate-cover-letter
        │
        ├─ canUseFeature("cover_letter", planType)
        ├─ AI generate cover letter
        ├─ INSERT into cover_letters (user_id, company, title, content)
        ├─ logUsage(userId, "cover_letter")
        └─ Return cover letter content
            │
            └─ Frontend renders CoverLetterResult
                ├─ Full letter preview
                ├─ Copy to clipboard
                └─ Edit/save options
```

**Key files:** `app/(dashboard)/cover-letter/page.tsx`, `app/api/generate-cover-letter/route.ts`

---

## 6. Interview Preparation

```
User visits /interview-prep
    │
    ├─ Input: Role, experience level, optional resume text
    │
    └─ POST /api/interview-prep
        │
        ├─ canUseFeature("interview_prep", planType)
        ├─ AI generate interview questions + answers
        ├─ INSERT into interview_sessions (user_id, role, experience_level, content_json)
        ├─ logUsage(userId, "interview_prep")
        ├─ recordDailyActivity(userId, "interview_prep")
        └─ Return InterviewPrepResponse
            │
            └─ Frontend renders InterviewQuestions
                ├─ Questions grouped by category (behavioral, technical, situational)
                ├─ Expandable answer sections
                └─ Tips per question
```

**Key files:** `app/(dashboard)/interview-prep/page.tsx`, `app/api/interview-prep/route.ts`

---

## 7. Auto Job Finder

```
User visits /job-finder
    │
    ├─ Input: Resume text (upload or paste) + optional location
    │
    └─ POST /api/auto-jobs
        │
        ├─ canUseFeature("job_finder", planType) ──► Free: 1/month
        ├─ AI extract skills from resume (cached, 7d TTL)
        │   └─ Returns: ExtractedSkills { technical[], soft[], experience_level }
        │
        ├─ Fetch jobs from Adzuna API (if ADZUNA_APP_ID configured)
        │   └─ GET https://api.adzuna.com/v1/api/jobs/in/search?what={skills}&where={location}
        │
        ├─ AI generate additional job suggestions
        ├─ INSERT into job_searches (user_id, resume_text, extracted_skills, job_results)
        ├─ logUsage(userId, "job_finder")
        └─ Return { skills, jobs[] }
            │
            └─ Frontend renders:
                ├─ SkillsOverview (extracted skills display)
                └─ JobResults (job cards with source filter: "All" | "Adzuna" | "AI Suggested")
                    │
                    └─ Each card: title, company, location, salary, apply link
```

**Key files:** `app/(dashboard)/job-finder/page.tsx`, `app/api/auto-jobs/route.ts`

---

## 8. AI Auto-Apply (Killer Feature)

```
User visits /auto-apply
    │
    ├─ Step 1: Configure
    │   ├─ Select resume (from uploaded resumes)
    │   ├─ Preferred location (optional)
    │   ├─ Preferred roles (optional)
    │   ├─ Min salary (optional)
    │   └─ Max results (5-20)
    │
    └─ POST /api/auto-apply
        │
        ├─ canUseFeature("auto_apply", planType) ──► Free: 2/month, Pro: unlimited
        ├─ Verify resume ownership
        ├─ INSERT into auto_apply_runs (status: "pending", config)
        ├─ logUsage(userId, "auto_apply")
        │
        └─ Fire-and-forget: runAutoApply(runId, userId, config).catch(() => {})
            │
            ├─ UPDATE run status → "processing"
            │
            ├─ Step A: Get structured resume
            │   └─ getOrCreateStructuredResume(resumeId, userId)
            │       ├─ Check resumes.structured_json column
            │       ├─ If empty: AI extract → save to DB
            │       └─ Auto-sync to candidate_skills + skill_badges (non-blocking)
            │
            ├─ Step B: Fetch jobs from multiple sources
            │   ├─ fetchAdzunaJobs(skills, location) ──► External API
            │   └─ fetchInternalJobs(skills) ──► job_postings table (recruiter-posted)
            │
            ├─ Step C: Pre-filter with JS math (NO AI cost)
            │   └─ autoApplyScorer.rankJobs(resume, allJobs, topN)
            │       ├─ skill_overlap * 0.6 (word-boundary regex)
            │       ├─ experience_match * 0.3
            │       └─ location_match * 0.1
            │       └─ Return top N jobs sorted by score
            │
            ├─ Step D: Deep AI match (only top N jobs)
            │   └─ For each top job:
            │       ├─ cachedAiGenerate(MATCH_PROMPT, { resume, job })
            │       │   └─ Returns: match_score, match_reason, mini cover letter
            │       │
            │       └─ calculateInterviewProbability(userId, structured, job)
            │           ├─ skill_overlap * 0.35 (dynamically adjusted)
            │           ├─ experience_alignment * 0.25
            │           ├─ resume_quality * 0.20
            │           └─ historical_success * 0.20
            │           └─ Returns: { score, level: HIGH/MEDIUM/LOW, reasons[], boost_tips[] }
            │
            ├─ Step E: Save results
            │   └─ UPDATE auto_apply_runs SET status="ready_for_review", results=matched_jobs
            │
            └─ 2-minute timeout safety net

    ┌──────────────────────────────────────────────────────┐
    │ Frontend polls: GET /api/auto-apply/{id} every 3s   │
    │                                                      │
    │ Shows AutoApplyProgress while status=processing      │
    │ Shows AutoApplyResults when status=ready_for_review  │
    └──────────────────────────────────────────────────────┘

    User reviews results:
        │
        ├─ Each job shows: JobMatchCard
        │   ├─ Match score circle
        │   ├─ Interview probability badge (HIGH/MEDIUM/LOW)
        │   ├─ Expandable interview chance panel
        │   ├─ Cover letter preview
        │   └─ Checkbox (select/deselect for apply)
        │
        ├─ PATCH /api/auto-apply/{id} ──► Save selected job IDs
        │
        └─ POST /api/auto-apply/{id}/confirm ──► Apply to selected jobs
            │
            ├─ For each selected job:
            │   ├─ INSERT into applications (company, role, status="applied", notes with match info)
            │   └─ logActivity(userId, "application_submitted")
            │
            ├─ checkAndLogMilestones(userId) ──► Auto-log at 10/25/50/100/250/500
            ├─ UPDATE run status → "completed", jobs_applied count
            ├─ createNotification(userId, "auto_apply", "Auto-Apply Complete!", details)
            └─ Return success
```

**Key files:** `app/(dashboard)/auto-apply/page.tsx`, `app/api/auto-apply/route.ts`, `app/api/auto-apply/[id]/route.ts`, `app/api/auto-apply/[id]/confirm/route.ts`, `lib/autoApplyEngine.ts`, `lib/autoApplyScorer.ts`, `lib/interviewScore.ts`, `lib/resumeStructurer.ts`

---

## 9. Smart Auto-Apply (Set & Forget)

```
User visits /smart-apply (Pro only)
    │
    ├─ Configure rules:
    │   ├─ Select resume
    │   ├─ Min match score (slider: 50-95%)
    │   ├─ Salary range (min/max)
    │   ├─ Preferred roles (list)
    │   ├─ Preferred locations (list)
    │   ├─ Include remote (toggle)
    │   ├─ Daily limit (1-10)
    │   └─ Weekly limit (5-50)
    │
    └─ POST /api/smart-apply
        │
        ├─ canUseFeature("smart_apply", planType) ──► Pro/Premium only
        ├─ UPSERT into smart_apply_rules (onConflict: user_id + resume_id)
        └─ Return rule

    ┌──────────────────────────────────────────────────────────────────────┐
    │ Cron trigger: POST /api/smart-apply/trigger (daily)                 │
    │                                                                      │
    │ runAllSmartRules():                                                   │
    │   ├─ getActiveSmartRules() ──► enabled=true AND next_run_at < now()  │
    │   │                                                                   │
    │   └─ For each rule: executeSmartRule(rule)                           │
    │       ├─ Create auto_apply_run (status: "pending")                   │
    │       ├─ runAutoApply(runId, userId, config from rule)               │
    │       │   └─ (Same flow as Manual Auto-Apply above)                  │
    │       │                                                               │
    │       ├─ Auto-select jobs meeting thresholds:                         │
    │       │   ├─ match_score >= rule.min_match_score                      │
    │       │   ├─ salary >= rule.salary_min (if set)                       │
    │       │   └─ Daily/weekly limits respected                            │
    │       │                                                               │
    │       ├─ Auto-confirm (no user review needed)                         │
    │       │   └─ Insert into applications for each qualifying job         │
    │       │                                                               │
    │       ├─ UPDATE rule: last_run_at, next_run_at, total_runs, applied  │
    │       └─ createNotification(userId, "auto_apply", "Smart Apply ran") │
    └──────────────────────────────────────────────────────────────────────┘
```

**Key files:** `app/(dashboard)/smart-apply/page.tsx`, `app/api/smart-apply/route.ts`, `app/api/smart-apply/trigger/route.ts`, `lib/smartApplyEngine.ts`

---

## 10. Resume Tailoring

```
User visits /tailor-resume
    │
    ├─ Input: Resume text + Job description + Job title
    │
    └─ POST /api/improve-resume (same endpoint as improvement)
        │
        ├─ Body includes jobTitle + jobDescription ──► AI uses context for tailoring
        └─ Returns tailored ImprovedResumeContent
            │
            └─ ImprovedResumeView with download options
```

**Key files:** `app/(dashboard)/tailor-resume/page.tsx`, `components/tailor/TailorResumeForm.tsx`

---

## 11. LinkedIn Import

```
User visits /import-linkedin
    │
    ├─ Option A: Upload LinkedIn PDF export
    ├─ Option B: Paste LinkedIn profile text (min 50 chars)
    │
    └─ POST /api/import-linkedin
        │
        ├─ AI parse LinkedIn profile ──► ImprovedResumeContent format
        └─ Return structured resume data
            │
            └─ ImprovedResumeView (download as PDF/DOCX)
```

**Key files:** `app/(dashboard)/import-linkedin/page.tsx`, `app/api/import-linkedin/route.ts`

---

## 12. Application Tracker

```
User visits /applications
    │
    ├─ GET /api/applications ──► List all applications for user
    │   └─ Returns: applications sorted by applied_date desc
    │
    ├─ View modes: Board (Kanban) or List
    │   │
    │   └─ Board columns: Saved → Applied → Interviewing → Offer → Rejected
    │
    ├─ Add application:
    │   └─ POST /api/applications
    │       ├─ Body: { company, role, status, applied_date, url, salary, location, notes }
    │       ├─ logActivity(userId, "application_submitted")
    │       ├─ checkAndLogMilestones(userId)
    │       └─ recordDailyActivity(userId, "apply")
    │
    ├─ Update status (drag & drop or click):
    │   └─ PATCH /api/applications/{id}
    │       └─ Partial update (status, notes, interview_date, offer_amount, etc.)
    │
    └─ Delete:
        └─ DELETE /api/applications/{id}
```

**Key files:** `app/(dashboard)/applications/page.tsx`, `components/applications/ApplicationBoard.tsx`

---

## 13. AI Career Coach

```
User visits /career-coach
    │
    └─ GET /api/career-coach
        │
        └─ getCareerDiagnosis(userId) [Pure JS — no AI cost]
            │
            ├─ Step 1: Gather data (parallel queries)
            │   ├─ applications (all statuses, counts)
            │   ├─ resume_analysis scores (via resumes join — no user_id on resume_analysis)
            │   ├─ candidate_skills (skill, skill_normalized, years_experience)
            │   └─ skill_demand (current month demand data)
            │
            ├─ Step 2: Diagnose problems
            │   ├─ ATS score < 60 ──► "Low ATS Score" problem + fix steps
            │   ├─ Interview rate < 10% + > 10 apps ──► "Wrong Role Targeting" + fix
            │   ├─ < 5 apps in 30 days ──► "Too Few Applications" + fix
            │   ├─ No tailored resumes ──► "Generic Resume" + fix
            │   └─ Profile strength < 50 ──► "Incomplete Profile" + fix
            │
            ├─ Step 3: Career direction analysis
            │   └─ Per applied role:
            │       ├─ count applications, interviews, offers
            │       ├─ Calculate interview_rate = interviews / total
            │       └─ Classify: >20% = "strong", >10% = "moderate", else "weak"
            │
            ├─ Step 4: Skill ROI ranking
            │   └─ Cross-reference user skills with skill_demand:
            │       ├─ highlight: have skill + high demand ──► "Keep showcasing"
            │       ├─ learn: high demand + don't have ──► "Learn this"
            │       └─ remove: have skill + low/no demand ──► "De-emphasize"
            │
            ├─ Step 5: Weekly summary
            │   ├─ This week vs last week: applications, interviews, response rate
            │   └─ Rate change (improving/declining/stable)
            │
            ├─ Step 6: Score transparency
            │   ├─ ATS breakdown: skill_match, format, keywords, experience (weights)
            │   ├─ Interview probability: 4 factors with dynamic weights
            │   └─ Candidate rank: profile, ATS, skills, activity, boost (components)
            │
            └─ Step 7: Overall status
                ├─ interview_rate > 25% ──► "thriving"
                ├─ interview_rate > 15% ──► "improving"
                ├─ has_apps + interview_rate > 5% ──► "struggling"
                ├─ has_apps + low_rate ──► "critical"
                └─ no apps ──► "new"

    Frontend renders:
        ├─ Status banner (color-coded: green/blue/yellow/orange/gray)
        ├─ Problems section (expandable cards with fix steps)
        ├─ Weekly performance summary with trend arrows
        ├─ Career direction per role (green/yellow/red indicators)
        ├─ Skill ROI ranking (highlight/learn/remove columns)
        └─ Score transparency section (expandable factor breakdowns)
```

**Key files:** `app/(dashboard)/career-coach/page.tsx`, `app/api/career-coach/route.ts`, `lib/careerCoach.ts`

---

## 14. Streak System & Rewards

```
┌─────────────────────────────────────────────────────────────────────┐
│ Streak Recording (happens automatically on every meaningful action) │
└─────────────────────────────────────────────────────────────────────┘
    │
    POST /api/streak (body: { action_type })  ──or──  Internal calls from other APIs
        │
        └─ recordDailyActivity(userId, actionType)
            │
            ├─ Check last_active_date from user_streaks
            │   │
            │   ├─ Same day ──► Just add XP, no streak change
            │   │
            │   ├─ Yesterday ──► Streak continues!
            │   │   ├─ current_streak++
            │   │   ├─ Update longest_streak if needed
            │   │   └─ Update streak_multiplier:
            │   │       ├─ 3d = 1.1x
            │   │       ├─ 7d = 1.25x
            │   │       ├─ 14d = 1.5x
            │   │       └─ 30d = 2.0x
            │   │
            │   ├─ Missed 1 day ──► Check streak_freeze_count
            │   │   ├─ Has freeze ──► Use freeze, keep streak, freeze_count--
            │   │   └─ No freeze ──► Reset to 1
            │   │
            │   └─ Missed 2+ days ──► Reset streak to 1
            │
            ├─ Award XP: base_xp * streak_multiplier
            │   ├─ apply: 10 XP
            │   ├─ resume_analyze: 15 XP
            │   ├─ resume_improve: 20 XP
            │   ├─ job_match: 10 XP
            │   ├─ cover_letter: 15 XP
            │   ├─ interview_prep: 25 XP
            │   └─ daily_login: 5 XP
            │
            └─ checkAndClaimRewards(userId, newStreak) [fire-and-forget]
                │
                └─ If newStreak matches a milestone day:
                    │
                    └─ claimStreakReward(userId, streakDays)
                        │
                        ├─ 3 days ──► streak_freeze: users.streak_freeze_count += 1
                        │
                        ├─ 7 days ──► auto_apply_credit:
                        │   ├─ DELETE most recent auto_apply usage_logs (gives back credits)
                        │   └─ Notify user
                        │
                        ├─ 14 days ──► profile_boost:
                        │   └─ activateBoost(userId, 3 days, 2.0x multiplier)
                        │
                        ├─ 21 days ──► streak_freeze: users.streak_freeze_count += 2
                        │
                        ├─ 30 days ──► profile_boost + auto_apply:
                        │   ├─ activateBoost(userId, 7 days, 2.0x)
                        │   └─ Notify "3 free auto-applies"
                        │
                        ├─ 50 days ──► profile_boost:
                        │   └─ activateBoost(userId, 14 days, 2.5x)
                        │
                        ├─ 75 days ──► pro_trial:
                        │   ├─ If plan_type == "free":
                        │   │   ├─ UPDATE plan_type = "pro"
                        │   │   └─ SET boost_expires_at = now + 7 days (trial expiry)
                        │   └─ Else: skip (already pro/premium)
                        │
                        └─ 100 days ──► permanent_boost:
                            ├─ UPDATE boost_multiplier = 1.5, is_boosted = true
                            └─ SET boost_expires_at = null (won't auto-expire)

                        After grant:
                        ├─ INSERT activity_feed (milestone, reward_claimed: true)
                        └─ createNotification(userId, "success", reward details)

┌────────────────────────────────────────────────────┐
│ Pro Trial Revert (runs inside checkBoostStatus)    │
│                                                     │
│ When boost_expires_at passes:                       │
│   ├─ Set is_boosted = false, boost_multiplier = 1.0 │
│   │                                                  │
│   └─ If plan_type == "pro":                          │
│       ├─ Check subscriptions for active sub          │
│       ├─ No active sub ──► Revert plan_type to "free"│
│       └─ Has active sub ──► Keep "pro" (paid user)   │
└────────────────────────────────────────────────────┘

User visits /streak-rewards:
    │
    └─ GET /api/streak-rewards
        │
        ├─ getUserStreak(userId) ──► streak data
        ├─ getStreakRewards(userId, currentStreak) ──► available/claimed rewards
        └─ Return combined data
            │
            └─ Frontend renders:
                ├─ Current streak card (fire icon, day count, level badge)
                ├─ Progress bar to next reward
                └─ Reward cards grid:
                    ├─ Locked (streak not reached) ──► grayed, shows "X days to go"
                    ├─ Unlocked (reached, not claimed) ──► highlighted, "Claim" button
                    └─ Claimed ──► checkmark, description of granted reward
```

**Key files:** `app/(dashboard)/streak-rewards/page.tsx`, `app/api/streak-rewards/route.ts`, `app/api/streak/route.ts`, `lib/streakSystem.ts`, `lib/streakRewards.ts`, `lib/candidateBoost.ts`

---

## 15. Daily Actions

```
User visits /dashboard (or /daily-actions loads)
    │
    └─ GET /api/daily-actions
        │
        └─ generateDailyActions(userId)
            │
            ├─ Check if today's actions already generated
            │   └─ Yes ──► Return existing actions + progress
            │
            ├─ Gather user context (parallel):
            │   ├─ Latest resume analysis score
            │   ├─ Recent applications count (7 days)
            │   ├─ Upcoming interviews
            │   ├─ Unread recruiter pushes
            │   ├─ Auto-apply results pending review
            │   ├─ Current streak data
            │   └─ Available job matches
            │
            ├─ Build prioritized action list (max 5):
            │   │
            │   ├─ URGENT (priority 2):
            │   │   ├─ "Respond to recruiter" (if unread pushes)
            │   │   └─ "Prepare for interview" (if interview in 3 days)
            │   │
            │   ├─ HIGH (priority 1):
            │   │   ├─ "Improve your resume" (if ATS score < 60)
            │   │   ├─ "Review auto-apply matches" (if pending results)
            │   │   └─ "Apply to top matches" (if good matches available)
            │   │
            │   └─ NORMAL (priority 0):
            │       ├─ "Check salary insights"
            │       ├─ "Update skills"
            │       ├─ "Review competition"
            │       └─ "Explore analytics"
            │
            └─ INSERT into daily_actions (one per action)

    User completes action:
        │
        └─ PATCH /api/daily-actions (body: { action_id })
            │
            ├─ UPDATE daily_actions SET completed = true, completed_at = now()
            ├─ recordDailyActivity(userId, action_type) ──► streak + XP
            └─ Return updated progress
                │
                └─ Frontend: progress bar fills, celebration animation at 100%
```

**Key files:** `components/dashboard/DailyActions.tsx`, `app/api/daily-actions/route.ts`, `lib/dailyActions.ts`

---

## 16. Opportunity Alerts

```
Dashboard loads OpportunityAlerts component
    │
    └─ GET /api/opportunity-alerts?scan=true
        │
        ├─ getActiveAlerts(userId) ──► non-dismissed, non-expired alerts
        │
        └─ If scan=true: scanOpportunities(userId)
            │
            ├─ Check recent auto-apply results for high matches (>85%)
            │   └─ createHighMatchAlert(userId, jobTitle, company, score)
            │       └─ Dedup: won't create if same job already alerted
            │
            ├─ Check for low-competition jobs
            │   └─ createLowCompetitionAlert(userId, job, applicantCount)
            │
            └─ Check for unresponded recruiter pushes
                └─ createRecruiterInterestAlert(userId, recruiterName, pushType)

    Frontend renders:
        ├─ Alert cards (urgency color-coded: red/orange/yellow/blue)
        ├─ Each card: title, description, action link, dismiss button
        │
        ├─ Click action link ──► Navigate to relevant page
        │
        └─ Dismiss:
            └─ PATCH /api/opportunity-alerts (body: { alert_id, action: "dismiss" })
                └─ UPDATE opportunity_alerts SET dismissed = true
```

**Key files:** `components/dashboard/OpportunityAlerts.tsx`, `app/api/opportunity-alerts/route.ts`, `lib/opportunityAlerts.ts`

---

## 17. Candidate Boost & Ranking

```
┌─────────────────────────────────────┐
│ Candidate Rank Score Calculation     │
│ (called from various triggers)       │
└─────────────────────────────────────┘
    │
    updateCandidateRank(userId):
        │
        ├─ Fetch factors:
        │   ├─ users.profile_strength (0-100)
        │   ├─ Best ATS score (resume_analysis via resumes join)
        │   ├─ Skills count (candidate_skills, capped at 30)
        │   └─ Recent activity count (activity_feed, 30 days, capped at 50)
        │
        ├─ Calculate: profile*0.25 + ATS*0.30 + skills*0.25 + activity*0.20
        │
        ├─ Apply boost: if is_boosted, multiply by boost_multiplier (cap 100)
        │
        └─ UPDATE users SET candidate_rank_score = result

┌─────────────────────────────────────┐
│ Profile Boost Activation             │
└─────────────────────────────────────┘
    │
    POST /api/candidate-boost
        │
        ├─ Pro/Premium only
        ├─ activateBoost(userId, durationDays, multiplier)
        │   ├─ Premium: 2.5x multiplier
        │   └─ Pro: 2.0x multiplier
        │
        └─ UPDATE users SET is_boosted=true, boost_expires_at, boost_multiplier

┌─────────────────────────────────────┐
│ Boost Expiry Check                   │
│ (runs on checkBoostStatus calls)     │
└─────────────────────────────────────┘
    │
    checkBoostStatus(userId):
        ├─ If boost_expires_at < now():
        │   ├─ Reset: is_boosted=false, boost_multiplier=1.0
        │   └─ Check pro trial revert:
        │       ├─ If plan_type="pro" AND no active subscription
        │       │   └─ Revert plan_type to "free"
        │       └─ If has active subscription ──► keep "pro"
        │
        └─ Return current boost status
```

**Key files:** `app/api/candidate-boost/route.ts`, `lib/candidateBoost.ts`

---

## 18. Skill Demand Dashboard

```
User visits /skill-demand
    │
    └─ GET /api/skill-demand
        │
        ├─ Fetch user's skills from candidate_skills table
        │
        └─ getSkillDemandDashboard(userSkills)
            │
            ├─ Query skill_demand table (current month, top 200 by demand)
            │
            ├─ Categorize:
            │   ├─ trending_skills: trend > 10% (top 10)
            │   ├─ declining_skills: trend < -10% (top 10)
            │   ├─ highest_paying: sorted by avg_salary (top 10)
            │   └─ most_in_demand: sorted by demand_count (top 10)
            │
            ├─ Analyze user's skills:
            │   └─ Cross-reference user skills with demand data
            │       └─ Status per skill: hot / growing / stable / declining / oversaturated
            │
            └─ Return dashboard

    ┌────────────────────────────────────────────────────────────┐
    │ Data Refresh (via cron):                                    │
    │                                                              │
    │ refreshSkillDemand():                                        │
    │   ├─ Count skills from active job_postings (demand)          │
    │   ├─ Count skills from candidate_skills (supply)             │
    │   ├─ Get previous month data for trend calculation           │
    │   ├─ Calculate demand_supply_ratio, demand_trend (% change)  │
    │   ├─ Average salary from job posting salary ranges           │
    │   └─ UPSERT into skill_demand (onConflict: skill+month)     │
    └────────────────────────────────────────────────────────────┘
```

**Key files:** `app/(dashboard)/skill-demand/page.tsx`, `app/api/skill-demand/route.ts`, `lib/skillDemand.ts`

---

## 19. Salary Intelligence

```
User visits /salary-insights
    │
    ├─ Input: Job title (required) + optional location + experience years
    │
    └─ GET /api/salary-intelligence?title=...&location=...&experience=...
        │
        └─ getSalaryIntelligence(title, location, experience)
            │
            ├─ Query salary_data table (normalized_title ILIKE, location)
            ├─ Query job_postings (salary_min/max for active jobs)
            │
            ├─ Calculate:
            │   ├─ salary_range: { min, max, average }
            │   ├─ percentiles: { p25, p50, p75 }
            │   ├─ trend: rising / stable / declining
            │   └─ comparable_roles: similar titles with salaries
            │
            └─ Return SalaryIntelligence
                │
                └─ Frontend renders:
                    ├─ Salary range bar (min ← avg → max)
                    ├─ Percentile distribution
                    ├─ Trend indicator (arrow + label)
                    └─ Comparable roles table
```

**Key files:** `app/(dashboard)/salary-insights/page.tsx`, `app/api/salary-intelligence/route.ts`, `lib/salaryIntelligence.ts`

---

## 20. Resume Performance Index

```
User visits /resume-performance
    │
    └─ GET /api/resume-performance
        │
        ├─ getResumePerformance(userId)
        │   │
        │   ├─ Get all resumes + their applications
        │   ├─ Per resume version:
        │   │   ├─ total_applications
        │   │   ├─ interview_count (status: interviewing/offer)
        │   │   ├─ offer_count
        │   │   ├─ rejection_rate
        │   │   └─ interview_rate
        │   │
        │   ├─ Find best_resume (highest interview rate)
        │   ├─ Score threshold analysis:
        │   │   └─ "Jobs above 80% match = 3x interview rate"
        │   ├─ Optimal daily apply count (based on history)
        │   └─ Role recommendations (by interview success)
        │
        └─ getHiringBenchmark(userId)
            │
            ├─ Compare user rank vs all users
            ├─ your_score vs platform_average
            └─ percentile_rank

    Frontend renders:
        ├─ Hiring benchmark card (percentile ring)
        ├─ AI insights (best resume, threshold, daily count)
        ├─ Per-resume performance cards
        ├─ Role performance chart
        └─ "Share Benchmark" button ──► createShareableResult()
```

**Key files:** `app/(dashboard)/resume-performance/page.tsx`, `app/api/resume-performance/route.ts`, `lib/resumePerformance.ts`

---

## 21. Candidate Competition

```
User visits /analytics (competition section)
    │
    └─ GET /api/competition
        │
        └─ getOverallCompetition(userId)
            │
            ├─ Count user's total applications
            ├─ Get user's candidate_rank_score
            ├─ Count users with lower rank ──► percentile
            ├─ Get strongest skill (most experienced)
            │
            └─ Return:
                ├─ total_jobs_applied
                ├─ avg_rank_percentile (0-100)
                ├─ strongest_skill_area
                └─ competitive_advantage (text recommendation)

Per-job competition (used in auto-apply results):
    │
    getJobCompetition(userId, jobId, matchScore):
        │
        ├─ Count other applicants (job_applications table)
        ├─ Rank user's score against others
        ├─ Calculate percentile
        ├─ Determine competition_level: low/medium/high/very_high
        └─ Generate insights:
            ├─ "You're in top 5% of applicants"
            ├─ "Your score is 15% above average"
            └─ "Low competition — your chances are strong!"
```

**Key files:** `app/api/competition/route.ts`, `lib/candidateCompetition.ts`

---

## 22. Hiring Prediction

```
POST /api/hiring-prediction
    │
    ├─ Body: { candidate_skills[], job_title, job_skills_required[], match_score?, experience_years? }
    │
    └─ predictHiringSuccess(skills, title, jobSkills, score, experience)
        │
        ├─ Factor 1: Skill match score (35%)
        │   └─ Fuzzy matching: candidate skills vs job skills (includes/included by)
        │
        ├─ Factor 2: Experience fit (25%)
        │   ├─ Under-qualified: proportional penalty
        │   └─ Over-qualified (>2x required): 80% (overqualified penalty)
        │
        ├─ Factor 3: Historical success rate (25%)
        │   ├─ Query hiring_outcomes table
        │   ├─ Filter by job_title keyword similarity (at least 1 word match)
        │   ├─ Fall back to all outcomes if <5 title matches
        │   └─ Calculate: hired_count / total_outcomes * 100
        │
        ├─ Factor 4: Role demand (15%)
        │   ├─ Query skill_demand (current month, user's skills)
        │   └─ demand / supply ratio → scaled to 0-100
        │
        ├─ Weighted sum ──► probability (clamped 5-95)
        │
        ├─ Confidence: high (20+ similar hires), medium (5+), low (<5)
        │
        └─ Recommendations:
            ├─ Low skill match ──► "Add missing skills: X, Y, Z"
            ├─ Low experience ──► "Highlight project experience"
            ├─ Low probability ──► "Consider tailoring resume"
            └─ High probability ──► "Strong match! Apply quickly"
```

**Key files:** `app/api/hiring-prediction/route.ts`, `lib/hiringPrediction.ts`

---

## 23. Shareable Results & Viral Loop

```
User clicks "Share" on any score
    │
    └─ POST /api/share-result
        │
        ├─ Body: { type: "ats_score" | "interview_probability" | "hiring_benchmark", data }
        │
        └─ createShareableResult(userId, type, data)
            │
            ├─ Generate random 32-char hex token
            ├─ Store in notifications table (data includes share_token + result)
            └─ Return { token, url: "/results/{token}" }

    Public user opens shared link:
        │
        └─ /results/[token] (PUBLIC — no auth required)
            │
            ├─ GET /api/share-result?token=...
            │   └─ getSharedResult(token)
            │       └─ Query notifications WHERE data->share_token = token
            │
            ├─ Render shared result card:
            │   ├─ Score visualization
            │   ├─ Factor breakdown
            │   └─ OG meta tags (for WhatsApp/LinkedIn preview)
            │
            └─ CTA: "Get Your Score → Sign Up Free"

Resume DOCX exports include "Created with AI Job Assistant" watermark
    └─ Passive brand awareness when candidates share documents
```

**Key files:** `app/results/[token]/page.tsx`, `app/api/share-result/route.ts`, `lib/shareableResults.ts`

---

## 24. Notifications System

```
Notification creation (from various sources):
    │
    ├─ Auto-apply completion ──► createNotification("auto_apply", ...)
    ├─ Smart apply results ──► createNotification("auto_apply", ...)
    ├─ Recruiter message ──► createNotification("message", ...)
    ├─ Recruiter push ──► createNotification("info", ...)
    ├─ Streak reward claimed ──► createNotification("success", ...)
    └─ Daily report ──► createNotification("info", ...)
        │
        └─ INSERT into notifications (user_id, type, title, message, data, read=false)

Frontend: NotificationBell component (in Topbar/RecruiterTopbar)
    │
    ├─ On mount:
    │   ├─ GET /api/notifications ──► Load initial notifications
    │   └─ Subscribe to Supabase Realtime (notifications table INSERT events)
    │       └─ On new notification: add to list + show toast popup + increment badge
    │
    ├─ Fallback: poll every 60s if Realtime unavailable
    │
    ├─ Click bell ──► Dropdown with notification list
    │   ├─ Each notification: icon, title, message, time ago
    │   └─ Click notification ──► Navigate to relevant page
    │
    └─ Mark read:
        └─ PATCH /api/notifications
            ├─ Body: { id } ──► Mark single notification read
            └─ Body: { mark_all_read: true } ──► Mark all read
```

**Key files:** `components/layout/NotificationBell.tsx`, `app/api/notifications/route.ts`, `lib/notifications.ts`

---

## 25. Public Profiles

```
User enables profile visibility:
    │
    └─ PATCH /api/profile (body: { profile_visible: true })
        │
        ├─ ensurePublicSlug(userId, name) ──► Generate URL-friendly slug
        ├─ calculateProfileStrength(profile) ──► Update score
        └─ UPDATE users SET profile_visible, public_slug, profile_strength

Public visitor opens /u/[slug]:
    │
    └─ Server Component (no auth required)
        │
        ├─ Query users WHERE public_slug = slug AND profile_visible = true
        ├─ Query skill_badges for user
        ├─ Query best ATS score (via resumes join)
        │
        └─ Render:
            ├─ Avatar initial + name + headline
            ├─ Bio
            ├─ Profile strength meter
            ├─ ATS score bar
            ├─ Skill badges (Expert/Intermediate/Beginner)
            └─ Signup CTA
```

**Key files:** `app/u/[slug]/page.tsx`, `app/api/profile/route.ts`, `lib/publicProfile.ts`, `lib/candidateGraph.ts`

---

## 26. SEO Pages (Data Moat)

```
/skills — "Top Skills to Get Hired in 2026" (PUBLIC, SSR)
    │
    ├─ Server Component with SEO metadata + OG tags
    ├─ Query skill_demand (current month, all skills)
    ├─ Categorize:
    │   ├─ Interview-guarantee skills (demand/supply ratio > 2)
    │   ├─ Highest paying skills (by avg_salary)
    │   ├─ Trending skills (demand_trend > 10%)
    │   └─ Most in-demand (by demand_count)
    └─ Signup CTA: "Get 3x More Interviews"

/salary — "Highest Paying Tech Roles 2026" (PUBLIC, SSR)
    │
    ├─ Server Component with SEO metadata + OG tags
    ├─ Query salary_data (aggregated by normalized_title)
    ├─ Display: role, avg salary, range, data points
    ├─ City links for internal linking
    └─ Signup CTA

/salary/[slug] — Role-specific salary page (PUBLIC, SSR)
    │
    ├─ Slug format: "react-developer-in-bangalore"
    ├─ Query salary_data + job_postings for role
    └─ Detailed salary analysis with skills, trends

/jobs — Job listings index (PUBLIC, SSR)
    │
    ├─ List active job_postings with pagination
    └─ Popular skills and locations for SEO linking

/jobs/[slug] — Individual job page (PUBLIC, SSR)
    │
    ├─ JSON-LD structured data (JobPosting schema)
    ├─ Full job details: title, company, salary, skills, location
    └─ CTA: "Apply with AI-Powered Resume"
```

**Key files:** `app/skills/page.tsx`, `app/salary/page.tsx`, `app/salary/[slug]/page.tsx`, `app/jobs/page.tsx`, `app/jobs/[slug]/page.tsx`

---

## 27. Recruiter: Job Posting & Management

```
Recruiter visits /recruiter/jobs
    │
    ├─ GET /api/recruiter/jobs ──► List recruiter's job postings
    │
    ├─ Create new job: /recruiter/jobs/new
    │   │
    │   ├─ AI generate description:
    │   │   └─ POST /api/recruiter/jobs/generate-description
    │   │       └─ Body: { title, skills, experience, work_type }
    │   │
    │   └─ POST /api/recruiter/jobs
    │       └─ INSERT into job_postings (recruiter_id, company_id, title, ...)
    │
    ├─ Edit: /recruiter/jobs/[id]
    │   └─ PATCH /api/recruiter/jobs/{id}
    │
    ├─ Optimize with AI: /recruiter/jobs/[id]/optimize
    │   └─ POST /api/recruiter/jobs/{id}/optimize
    │       └─ AI returns: suggestions, optimized_title, optimized_description, score
    │
    └─ Auto-shortlist: /recruiter/jobs/[id]/auto-shortlist
        └─ POST /api/recruiter/jobs/{id}/auto-shortlist
            └─ AI screens unreviewed applications, shortlists top matches
```

**Key files:** `app/(recruiter)/recruiter/jobs/`, `app/api/recruiter/jobs/`

---

## 28. Recruiter: Candidate Search & ATS Pipeline

```
Recruiter visits /recruiter/candidates
    │
    └─ GET /api/recruiter/candidates
        │
        ├─ Filters: skills, experience, location
        ├─ Query users WHERE profile_visible = true
        ├─ Enrich with candidate_skills, resume_analysis
        └─ Return ranked candidates

ATS Pipeline: /recruiter/applications
    │
    ├─ GET /api/recruiter/applications ──► List by stage
    │
    ├─ Stages: Applied → Shortlisted → Interview Scheduled → Interviewed → Offer Sent → Hired/Rejected
    │
    ├─ AI Screening:
    │   └─ POST /api/recruiter/applications/{id}/screen
    │       └─ AI evaluates resume vs job requirements
    │           └─ Returns: match_score, strengths, gaps, recommendation
    │
    ├─ Schedule Interview:
    │   └─ PATCH /api/recruiter/applications/{id}/interview
    │       └─ UPDATE stage, interview_date, interview_notes
    │
    └─ Update stage (drag/click):
        └─ PATCH /api/recruiter/applications/{id}
            └─ UPDATE stage, notes, rating

Similar Candidates:
    └─ GET /api/recruiter/candidates/{id}/similar
        │
        └─ findSimilarCandidates(userId)
            ├─ Get user's candidate_skills
            ├─ Find other users with overlapping skills
            ├─ Calculate Jaccard similarity
            └─ Return top 10 similar candidates
```

**Key files:** `app/(recruiter)/recruiter/candidates/`, `app/(recruiter)/recruiter/applications/`, `lib/candidateGraph.ts`

---

## 29. Recruiter: Instant Shortlist

```
Recruiter visits /recruiter/instant-shortlist
    │
    ├─ Step 1: Select a job posting (or enter custom job details)
    │   ├─ job_title (required)
    │   ├─ skills_required[] (required)
    │   ├─ experience_min/max (optional)
    │   └─ location (optional)
    │
    └─ POST /api/recruiter/instant-shortlist
        │
        └─ getInstantShortlist(jobTitle, skills, expMin, expMax, location, limit)
            │
            ├─ Query candidate_skills WHERE skill_normalized IN normalized_skills
            │   └─ Get all users who have at least 1 matching skill
            │
            ├─ For each candidate:
            │   ├─ Calculate skill_overlap: matched_skills / required_skills * 100
            │   ├─ Get profile data: name, headline, profile_strength, rank_score
            │   ├─ Get ATS score (via resumes → resume_analysis join)
            │   ├─ Identify missing_skills
            │   │
            │   └─ Composite score:
            │       ├─ skill_overlap * 0.50
            │       ├─ profile_strength * 0.20
            │       ├─ rank_score * 0.20
            │       └─ boost_bonus * 0.10 (boosted candidates get extra)
            │
            ├─ Sort by composite score, return top N
            │
            └─ Return candidates with full breakdown (trust layer)

    Frontend renders:
        ├─ Candidate cards (ranked)
        │   ├─ Name, headline, match score
        │   ├─ Matched skills (green) + Missing skills (red)
        │   ├─ Score breakdown (expandable trust layer)
        │   └─ "Reach Out" button
        │
        └─ "Message All" bulk outreach
            └─ POST /api/recruiter/push (for each candidate)
                ├─ push_type: "shortlisted"
                ├─ title: "You've been shortlisted!"
                └─ Creates notification for candidate bell
```

**Key files:** `app/(recruiter)/recruiter/instant-shortlist/page.tsx`, `app/api/recruiter/instant-shortlist/route.ts`, `lib/instantShortlist.ts`

---

## 30. Recruiter: Messaging & Templates

```
Recruiter visits /recruiter/messages
    │
    ├─ GET /api/recruiter/messages ──► List all conversations
    │
    ├─ Send message:
    │   └─ POST /api/recruiter/messages
    │       ├─ Body: { receiver_id, subject, content, job_id?, template_name? }
    │       ├─ INSERT into messages
    │       └─ createNotification(receiverId, "message", subject, content)
    │
    └─ Templates: /recruiter/templates
        ├─ Types: general, interview_invite, rejection, offer, follow_up
        ├─ CRUD: GET/POST/PATCH/DELETE /api/recruiter/templates
        └─ Use template: populates message content on compose
```

**Key files:** `app/(recruiter)/recruiter/messages/page.tsx`, `app/(recruiter)/recruiter/templates/page.tsx`, `app/api/recruiter/messages/route.ts`, `app/api/recruiter/templates/`

---

## 31. Recruiter: Intelligence Dashboard

```
Recruiter visits /recruiter/analytics
    │
    └─ GET /api/recruiter/intelligence
        │
        └─ getRecruiterIntelligence(recruiterId)
            │
            ├─ Hiring metrics:
            │   ├─ avg_time_to_hire (days)
            │   ├─ screening_to_interview_rate
            │   ├─ interview_to_offer_rate
            │   └─ offer_acceptance_rate
            │
            ├─ Pipeline health:
            │   ├─ Applications by stage (counts)
            │   └─ Stale applications (7+ days in early stage)
            │
            ├─ Source performance:
            │   └─ Applications per source (auto-apply, direct, referral)
            │
            ├─ Top jobs (by application count)
            │
            └─ AI recommendations:
                ├─ "5 stale applications need attention"
                ├─ "Your interview-to-offer rate is below average"
                └─ "Consider optimizing job descriptions"
```

**Key files:** `app/(recruiter)/recruiter/analytics/page.tsx`, `app/api/recruiter/intelligence/route.ts`, `lib/recruiterIntelligence.ts`

---

## 32. Recruiter: Auto-Push System

```
┌─────────────────────────────────────────────────────────────────┐
│ Daily Cron: runDailyRecruiterAutoPush()                          │
│ (called from POST /api/smart-apply/trigger)                      │
│                                                                   │
│ For each active job_posting:                                      │
│   │                                                               │
│   └─ autoPushCandidatesForJob(recruiterId, jobId, title, skills)  │
│       │                                                            │
│       ├─ Query candidate_skills for matching skills                │
│       ├─ Query users (visible, active in 30 days)                  │
│       ├─ Score by skill match count                                │
│       ├─ Dedup: skip if already pushed for this job                │
│       ├─ Send top 5:                                               │
│       │   └─ sendRecruiterPush(recruiterId, candidateId,           │
│       │       "shortlisted", "Matched for {title}", message)      │
│       │       ├─ INSERT into recruiter_pushes                      │
│       │       └─ createNotification for candidate                  │
│       └─ Rate limit: max 10 pushes/recruiter/day                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key files:** `lib/recruiterAutoPush.ts`, `lib/recruiterPush.ts`

---

## 33. AI Cache System

```
Any AI call via cachedAiGenerate() or cachedAiGenerateContent():
    │
    ├─ Step 1: Generate cache key
    │   └─ generateCacheKey(feature, content)
    │       └─ SHA-256 hash of normalized(feature + first ~5K chars of content)
    │
    ├─ Step 2: Check cache
    │   └─ getCachedResponse(hash)
    │       └─ SELECT FROM ai_cache WHERE hash = key AND expires_at > now()
    │       │
    │       ├─ HIT ──► Return cached response immediately (no AI call, no cost)
    │       └─ MISS ──► Continue to AI call
    │
    ├─ Step 3: AI call
    │   ├─ Try Gemini (gemini-2.5-flash)
    │   │   └─ On 429/quota error ──► Fall back to OpenAI (gpt-4o-mini)
    │   │
    │   └─ Get response
    │
    └─ Step 4: Store in cache
        └─ setCachedResponse(hash, response, feature)
            └─ UPSERT into ai_cache with TTL:
                ├─ resume_analysis: 7 days
                ├─ resume_improve: 7 days
                ├─ skill_extraction: 7 days
                ├─ job_match: 1 day
                ├─ job_finder: 1 day
                └─ default: 1 day

    Cost savings: ~30-50% reduction in AI API calls
```

**Key files:** `lib/ai.ts`, `lib/aiCache.ts`, `lib/gemini.ts`, `lib/openai.ts`

---

## 34. Rate Limiting

```
Every protected API route:
    │
    └─ checkRateLimit(userId)
        │
        ├─ Count usage_logs WHERE feature="rate_limit" AND timestamp > 1 minute ago
        │
        ├─ count < 10 ──► ALLOWED
        │   └─ INSERT usage_log (feature: "rate_limit")
        │   └─ Return { allowed: true }
        │
        └─ count >= 10 ──► BLOCKED
            └─ Return { allowed: false, retryAfterMs }
                │
                └─ API returns 429 Too Many Requests

    Design: fail-open (DB errors = allow request)
    Window: sliding 1 minute
    Limit: 10 requests per user per minute
```

**Key files:** `lib/rateLimit.ts`

---

## 35. Cron Jobs (Unified Trigger)

```
POST /api/smart-apply/trigger
    │
    ├─ Auth: Authorization header must match CRON_SECRET (production)
    │   └─ Dev: always allowed
    │
    └─ Runs 6 tasks sequentially:
        │
        ├─ 1. Smart Auto-Apply ──► runAllSmartRules()
        │   └─ Process enabled rules with past next_run_at
        │
        ├─ 2. Daily Reports ──► sendDailyReportNotification() for active users
        │   └─ Summarize last 24h activity
        │
        ├─ 3. Platform Stats ──► refreshPlatformStats()
        │   └─ Aggregate: total users, applications, hires, avg score
        │
        ├─ 4. Skill Demand ──► refreshSkillDemand()
        │   └─ Aggregate from job_postings + candidate_skills
        │
        ├─ 5. Recruiter Auto-Push ──► runDailyRecruiterAutoPush()
        │   └─ Match candidates to active jobs, send pushes
        │
        └─ 6. Opportunity Alerts ──► scanOpportunities() for recently active users
            └─ Detect high-match, low-competition, recruiter interest

    Recommended: Run daily at midnight via Vercel Cron / Railway / GitHub Actions
    Example: curl -X POST https://yourapp.com/api/smart-apply/trigger -H "Authorization: Bearer $CRON_SECRET"
```

**Key files:** `app/api/smart-apply/trigger/route.ts`

---

## Cross-Cutting Concerns

### Structured Resume Pipeline
```
Resume uploaded ──► First access to getOrCreateStructuredResume():
    ├─ AI extracts: skills[], experience[], projects[], education[], summary
    ├─ Saved to resumes.structured_json (cached, never re-extracted)
    ├─ Auto-sync to candidate_skills (for recruiter search)
    ├─ Auto-sync to skill_badges (for public profile)
    └─ Used by: auto-apply, career coach, interview score, instant shortlist
```

### Learning Engine (Dynamic Weight Adjustment)
```
Application outcomes tracked ──► getApplicationInsights():
    ├─ Analyzes: which skills correlate with interviews
    ├─ Adjusts interviewScore weights:
    │   ├─ High skill overlap → high interview rate ──► increase skill_weight
    │   ├─ Low ATS score → still get interviews ──► decrease resume_quality_weight
    │   └─ Weights approach optimal values over time
    └─ Used by: interviewScore.ts, analytics page, career coach
```

### Usage Tracking & Limits
```
Every feature-gated API:
    ├─ canUseFeature(userId, feature, planType)
    │   ├─ Pro/Premium: always allowed (limit: -1)
    │   └─ Free: check count vs FREE_LIMITS
    │
    ├─ logUsage(userId, feature) ──► INSERT usage_logs
    │
    └─ Free limits:
        ├─ resume_analysis: 3/month
        ├─ job_match: 3/month
        ├─ cover_letter: 1/month
        ├─ job_finder: 1/month
        ├─ auto_apply: 2/month
        ├─ interview_prep: 0 (Pro only)
        ├─ resume_improve: 0 (Pro only)
        └─ smart_apply: 0 (Pro only)
```
