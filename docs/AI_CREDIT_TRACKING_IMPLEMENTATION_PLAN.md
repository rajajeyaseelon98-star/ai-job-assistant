# AI Credit Tracking Implementation Plan

## Objective

Implement end-to-end AI token/credit tracking across the existing architecture, without breaking current feature flows.

## Scope

1. Detect and inventory all AI call paths.
2. Add centralized token + credit tracking in existing AI abstraction (`lib/ai.ts`).
3. Add database schema for granular usage logs (`ai_usage`) and credit balances (`users.total_credits`, `users.used_credits`).
4. Add usage APIs:
   - `GET /api/usage/summary`
   - `GET /api/usage/history`
   - `GET /api/usage/feature-breakdown`
5. Add UI page:
   - `/(dashboard)/usage`
6. Add optional enforcement hooks behind feature flags.

## Design Principles

- Reuse current primitives (`lib/ai.ts`, existing auth/usage patterns, React Query).
- Avoid introducing a parallel AI client abstraction.
- Keep enforcement behind flags to de-risk rollout.
- Track usage on both cache hit and cache miss (with separate markers).

## Phase A — AI Call Inventory

- Scan codebase for:
  - `aiGenerate`
  - `aiGenerateContent`
  - `cachedAiGenerate`
  - `cachedAiGenerateContent`
  - direct provider calls (`chatCompletion`, `geminiGenerate*`)
- Build a feature mapping table:
  - feature name
  - file path
  - function/endpoint
  - cache feature tag usage

Deliverable: inventory section in this doc.

## Phase B — Data Model

Add migration for:

### `public.ai_usage`
- `id uuid pk`
- `user_id uuid`
- `feature_name text`
- `provider text`
- `model_used text`
- `prompt_tokens int`
- `completion_tokens int`
- `total_tokens int`
- `credits_used numeric`
- `cost_usd numeric`
- `cost_inr numeric`
- `cache_hit boolean`
- `latency_ms int`
- `meta jsonb`
- `created_at timestamptz default now()`

Indexes:
- `(user_id, created_at desc)`
- `(user_id, feature_name, created_at desc)`

RLS:
- user can `SELECT` own rows
- user can `INSERT` own rows
- service role can write

### `public.users` credit columns
- `total_credits int default 100`
- `used_credits int default 0`

## Phase C — Central Tracking in `lib/ai.ts`

- Add lightweight token estimator fallback.
- Add unified `logAiUsage(...)` helper in `lib/aiUsage.ts`.
- Extend cached AI helpers to accept:
  - `userId`
  - `featureName` (fallback from `cacheFeature`)
  - `model/provider`
- Record usage after successful generation.
- For cache hits: log with `cache_hit=true` and low/zero token policy marker in `meta`.

## Phase D — APIs

Implement:

### `GET /api/usage/summary`
- totals: tokens, credits, estimated cost
- most used feature
- current credit balance

### `GET /api/usage/history`
- latest 50 logs (cursor-ready)

### `GET /api/usage/feature-breakdown`
- aggregate by feature (calls, tokens, credits, cost)

All APIs require auth and are user-scoped.

## Phase E — Frontend Dashboard

Create page: `app/(dashboard)/usage/page.tsx`

Sections:
1. Summary cards
2. Credit balance/progress
3. Feature usage table
4. History table

Add query hooks in `hooks/queries/use-ai-usage.ts`.

## Phase F — Enforcement (Flagged)

Add feature flags:
- `AI_CREDITS_ENFORCEMENT_ENABLED`
- `AI_USAGE_TRACKING_ENABLED`

When enforcement enabled:
1. Check remaining credits before AI execution.
2. Deduct used credits atomically after successful call.
3. Return canonical error:
   - `CREDITS_EXHAUSTED`

## Phase G — Rollout

1. Enable tracking only.
2. Validate telemetry and dashboards.
3. Enable enforcement for canary.
4. Ramp to full.

## AI Call Inventory (to be filled during implementation)

### Central abstraction

- `lib/ai.ts`
  - `cachedAiGenerate(...)`
  - `cachedAiGenerateContent(...)`
  - `cachedAiGenerateJsonWithGuard(...)`
  - provider routing (`geminiGenerate*` -> fallback `chatCompletion`)

### Feature routes and libs currently calling AI abstraction

- `app/api/analyze-resume/route.ts` -> `runAtsAnalysisFromText` (`resume_analysis`)
- `app/api/recruiter/resumes/[resumeId]/analyze/route.ts` -> `runAtsAnalysisFromText` (`resume_analysis`)
- `lib/ats-resume-analysis.ts` -> `cachedAiGenerateJsonWithGuard` (`resume_analysis`)
- `app/api/improve-resume/route.ts` -> compact + final guarded calls (`resume_improve`)
- `app/api/job-match/route.ts` -> guarded call (`job_match`)
- `app/api/generate-cover-letter/route.ts` -> cached call (`cover_letter`)
- `app/api/interview-prep/route.ts` -> cached call (`interview_prep`)
- `app/api/auto-jobs/route.ts` -> skill extraction + AI job generation + reason enrichment (`job_finder`)
- `lib/autoApplyEngine.ts` -> deep match (`auto_apply`)
- `lib/resumeStructurer.ts` -> seed + full structuring (`skill_extraction`)
- `app/api/import-linkedin/route.ts` -> cached parse call (`linkedin_import`)
- `app/api/public/fresher-resume/route.ts` -> cached generation (`fresher_resume_public`)
- `app/api/recruiter/jobs/generate-description/route.ts` -> cached generation (`job_description`)
- `app/api/recruiter/jobs/[id]/optimize/route.ts` -> cached optimization (`recruiter_job_optimize`)
- `app/api/recruiter/salary-estimate/route.ts` -> cached estimate (`recruiter_salary_estimate`)
- `app/api/recruiter/applications/[id]/screen/route.ts` -> guarded screening (`recruiter_candidate_screening`)
- `app/api/recruiter/jobs/[id]/auto-shortlist/route.ts` -> guarded shortlist (`auto_shortlist`)
- `app/api/recruiter/skill-gap/route.ts` -> guarded skill gap (`recruiter_skill_gap`)
