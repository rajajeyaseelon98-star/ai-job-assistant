# AI Job Assistant — Technical Appendix: API ↔ AI Evidence Matrix

**Purpose:** Map each HTTP API surface to whether it invokes an LLM, which library path it uses, and related server modules.  
**Companion:** `docs/CODEBASE_AI_ARCH_COST_REPORT.md` (narrative + cost model), `docs/CODEBASE_AI_ARCH_COST_REPORT_INVESTOR.md` (summary).

**Convention**

- **LLM path:** How the route reaches models — `cachedAiGenerate` / `cachedAiGenerateContent` (`lib/ai.ts`) prefer Gemini then OpenAI on quota-style errors; `generate-cover-letter` uses Gemini or OpenAI directly (see note).
- **Cache feature:** `cacheFeature` string or `lib/ats-resume-analysis.ts` / `lib/aiCache.ts` behavior where applicable.
- **Usage key:** `FeatureType` from `lib/usage-limits.ts` when the route calls `checkAndLogUsage` (verify in route for exact key).

---

## A) Routes that call the LLM stack

| HTTP route (file) | Entry | LLM helper | Cache / notes | Typical usage feature (verify in route) |
|-------------------|--------|------------|----------------|----------------------------------------|
| `POST /api/analyze-resume` | `app/api/analyze-resume/route.ts` | `lib/ats-resume-analysis.ts` → `cachedAiGenerateContent(..., "resume_analysis")` | `ai_cache` via cached wrapper | `resume_analysis` |
| `POST /api/recruiter/resumes/[resumeId]/analyze` | `app/api/recruiter/resumes/[resumeId]/analyze/route.ts` | Same ATS helper | Same | `resume_analysis` (recruiter path) |
| `POST /api/improve-resume` | `app/api/improve-resume/route.ts` | `cachedAiGenerate` + `cacheFeature: "resume_improve"` | TTL per `lib/aiCache.ts` | `resume_improve` |
| `POST /api/job-match` | `app/api/job-match/route.ts` | `cachedAiGenerate` + `cacheFeature: "job_match"` | Cached | `job_match` |
| `POST /api/generate-cover-letter` | `app/api/generate-cover-letter/route.ts` | **`geminiGenerateContent`** OR **`chatCompletion`** (not the shared `aiGenerate` fallback path) | **Not** using `cachedAiGenerate*` in this file | `cover_letter` |
| `POST /api/interview-prep` | `app/api/interview-prep/route.ts` | `cachedAiGenerate` JSON mode | Cached unless feature omitted | `interview_prep` |
| `POST /api/auto-jobs` | `app/api/auto-jobs/route.ts` | Multiple `cachedAiGenerate` calls (skills, listings, match reasons) | Mixed cache features in route | `job_finder` |
| `POST /api/import-linkedin` | `app/api/import-linkedin/route.ts` | `cachedAiGenerate` JSON mode | Check route for `cacheFeature` | (usage if logged — verify route) |
| `POST /api/public/fresher-resume` | `app/api/public/fresher-resume/route.ts` | `cachedAiGenerate` JSON mode | Public; cache key by prompt | No auth usage gate |
| `POST /api/auto-apply` (engine) | `lib/autoApplyEngine.ts` | `cachedAiGenerate` per job deep match; **`cacheFeature: "job_match"`** (same TTL bucket as `/api/job-match`; cache hit rare per pair) | **+** `getOrCreateStructuredResume` **before** loop (hidden if `structured_json` empty) | `auto_apply` |
| `lib/resumeStructurer.ts` | Called from auto-apply / lazy structuring | `cachedAiGenerate` + `cacheFeature: "skill_extraction"` | Persists `resumes.structured_json` | Internal |
| `POST /api/recruiter/jobs/generate-description` | `app/api/recruiter/jobs/generate-description/route.ts` | `cachedAiGenerate` JSON mode | Recruiter-only | (verify usage) |
| `POST /api/recruiter/jobs/[id]/optimize` | `app/api/recruiter/jobs/[id]/optimize/route.ts` | `cachedAiGenerate` JSON mode | Recruiter-only | (verify usage) |
| `POST /api/recruiter/jobs/[id]/auto-shortlist` | `app/api/recruiter/jobs/[id]/auto-shortlist/route.ts` | `cachedAiGenerate` in batches | **High token surface** | (verify usage) |
| `POST /api/recruiter/applications/[id]/screen` | `app/api/recruiter/applications/[id]/screen/route.ts` | `cachedAiGenerate` JSON mode | Per application | (verify usage) |
| `POST /api/recruiter/salary-estimate` | `app/api/recruiter/salary-estimate/route.ts` | `cachedAiGenerate` JSON mode | Recruiter-only | (verify usage) |
| `POST /api/recruiter/skill-gap` | `app/api/recruiter/skill-gap/route.ts` | `cachedAiGenerate` JSON mode | Recruiter-only | (verify usage) |

**Evidence grep anchor:** `cachedAiGenerate`, `cachedAiGenerateContent`, `geminiGenerateContent`, `chatCompletion` under `app/api` and `lib/autoApplyEngine.ts`, `lib/resumeStructurer.ts`, `lib/ats-resume-analysis.ts`.

---

## B) Shared LLM infrastructure (not routes)

| Module | Role |
|--------|------|
| `lib/gemini.ts` | `gemini-2.5-flash`; `GEMINI_API_KEY` |
| `lib/openai.ts` | `gpt-4o-mini`; `OPENAI_API_KEY` |
| `lib/ai.ts` | `aiGenerate` / `aiGenerateContent`; quota-aware fallback; `cachedAiGenerate*` |
| `lib/aiCache.ts` | `ai_cache` table; SHA-256 keys; per-feature TTL |

---

## C) “AI-branded” but no external LLM (verify before billing as AI cost)

| Route / lib | Behavior |
|-------------|----------|
| `POST /api/career-coach` | `lib/careerCoach.ts` — deterministic / analytics (KT: no AI cost) |
| `POST /api/hiring-prediction` | `lib/hiringPrediction.ts` — weighted model |
| Interview probability in auto-apply | `lib/interviewScore.ts` — JS scoring |
| Various ranking / shortlist **non-LLM** helpers | `lib/instantShortlist.ts`, `lib/autoApplyScorer.ts`, etc. |

---

## D) Full API route inventory (94 handlers) — LLM vs non-LLM

**LLM:** listed in section A.  
**Non-LLM (representative):** auth/session-adjacent `app/auth/callback`, `GET/POST/PATCH` user/profile, `upload-resume`, `messages/*`, `notifications`, `applications`, `jobs` CRUD/apply, `dashboard`, `history`, `usage`, `platform-stats`, `activity-feed`, `streak*`, `daily-actions`, `opportunity-alerts`, `insights`, `competition`, `salary-intelligence`, `skill-demand`, `resume-performance`, `share*`, `public/extract-resume` (parse only), improved-resume CRUD/export, recruiter CRUD for company/jobs/applications/templates/alerts (except optimize/generate-description/auto-shortlist/screen/salary/skill-gap), `smart-apply` CRUD, `smart-apply/trigger` (orchestration), `hiring-prediction`, `career-coach`, `feedback`, `dev/plan`, `candidate-boost`, `daily-report`, etc.

For a raw file list, see `app/api/**/route.ts` (94 files in repo snapshot).

---

## E) Environment variables (AI)

| Variable | Used in |
|----------|---------|
| `GEMINI_API_KEY` | `lib/gemini.ts` |
| `OPENAI_API_KEY` | `lib/openai.ts` |

If only one is set, `lib/ai.ts` uses whichever path is available (Gemini first when key present).
