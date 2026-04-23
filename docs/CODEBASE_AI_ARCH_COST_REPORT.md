# AI Job Assistant - Technical, AI, and Cost Analysis Report (Corrected)

## Document status

This edition **replaces** the first cost/token section with numbers grounded in **actual prompts and payload shapes** in `lib/`, `app/api/**`, and orchestrators. The prior version **materially underestimated** several features by (a) using a single “average tokens per request” for **multi-call** flows, (b) **omitting** the resume structurer step in auto-apply, (c) understating **output** size for JSON-heavy endpoints, and (d) understating **auto-apply deep-match** input size (full structured resume JSON per job).

---

## Executive Summary

The application is a full-stack Next.js SaaS: resume intelligence, job matching, assisted and scheduled auto-apply, recruiter workflows, and engagement loops. Inference is **Gemini `gemini-2.5-flash` first**, **OpenAI `gpt-4o-mini` on quota-style failure** (`lib/ai.ts`, `lib/gemini.ts`, `lib/openai.ts`).

**Largest cost and latency bottlenecks (corrected view):**

1. **Auto-apply (`lib/autoApplyEngine.ts`)** — For each run: optional **`getOrCreateStructuredResume`** (`lib/resumeStructurer.ts`, up to **10k** chars of `parsed_text` → large JSON out), then **one LLM call per ranked job** (default **`max_results` 10**, max **15**) with **`JSON.stringify(structured, null, 2)`** in the user payload. That structured blob often dominates token count versus a raw resume snippet.
2. **Job finder (`app/api/auto-jobs/route.ts`)** — **Three** LLM calls on the happy path; the **“generate 8–12 AI job listings”** call has **very large JSON output** compared to skill extraction.
3. **Recruiter auto-shortlist (`app/api/recruiter/jobs/[id]/auto-shortlist/route.ts`)** — Batches of **10** candidates; each resume slice up to **3000** chars plus long job context → **large inputs per batch**, looped over all applicants.
4. **Interview prep (`app/api/interview-prep/route.ts`)** — **Small input**, but the prompt requires **many Q&A pairs with answers** → **large output** (often under-estimated when pricing with “average tokens”).
5. **Resume improve (`app/api/improve-resume/route.ts`)** — Long **system** prompt plus up to **~12k** chars resume and **~4k** JD → **high input**, **large JSON resume** out.

---

## 1) Tech Stack Identification

(Summary unchanged from prior edition.)

### Frontend

- **Framework:** Next.js 15 (App Router), React 18, TypeScript  
- **Styling/UI:** Tailwind CSS, PostCSS, Autoprefixer  
- **Client UX libs:** Framer Motion, Lucide React, React Markdown  
- **Forms/Data fetching:** React Hook Form, TanStack React Query  

### Backend

- **Runtime:** Node.js (Next.js server; CI uses Node 20)  
- **API layer:** Next.js Route Handlers (`app/api/**/route.ts`)  
- **Middleware:** `middleware.ts` for session/route protection and role gating  

### Database and Data Platform

- **Primary DB:** Supabase PostgreSQL  
- **Security model:** RLS on core tables  
- **Realtime:** Supabase Realtime on messaging/notifications paths  

### Authentication

- **Auth provider:** Supabase Auth  
- **Methods:** Email/password and Google OAuth  
- **Authorization:** Role-based routing (`job_seeker`, `recruiter`)  

### File Storage / CDN

- **Object storage:** Supabase Storage (`resumes`, `avatars`, `company-logos`, `message-attachments`)  

### APIs / Integrations

- **AI:** Google Gemini + OpenAI fallback  
- **Jobs:** Adzuna API  
- **Parsing:** `pdf-parse`, `mammoth`  
- **Documents:** `docx`  

### Hosting / Deployment Indicators

- **Hosting signal:** Vercel (docs + conventions)  
- **CI/CD:** GitHub Actions  
- **Scheduler:** Cron-style `POST /api/smart-apply/trigger`  

### State Management

- **Server-state:** TanStack Query  
- **Local state:** React hooks  
- **Persistence:** `localStorage` / `sessionStorage` in selected flows  

---

## 2) Feature Extraction

High-level groupings are unchanged: core platform (auth, roles, profile, usage, notifications, messaging), job-seeker tools (resume, match, cover, interview, finder, auto-apply, smart-apply, tracker, analytics, streaks, etc.), recruiter tools (jobs, pipeline, candidates, AI screening, messaging), background (cron, cache, rate limits). See prior sections in this file or `docs/KNOWLEDGE_TRANSFER.md` for page-to-route detail.

---

## 3) AI Feature Detection

The inventory of LLM-backed features is unchanged in substance; see the table in the previous edition or `docs/CODEBASE_AI_ARCH_COST_REPORT_APPENDIX.md`.

---

## 4) Hidden AI Calls (Easy to Miss in UX or “One Click” Flows)

These **do not always appear** as a separate button but still bill tokens when cache misses:

| Hidden step | Where | What happens |
|-------------|--------|----------------|
| **Resume structurer** | `lib/resumeStructurer.ts` → called from `runAutoApply` | If `resumes.structured_json` is null, **one** `cachedAiGenerate` over **up to 10,000** chars of `parsed_text` with a long `STRUCTURING_PROMPT`, `cacheFeature: "skill_extraction"`. Result persisted; later runs skip the call. |
| **Auto-apply = structurer + N deep matches** | `lib/autoApplyEngine.ts` | User triggers one “auto-apply run”; server may run **1 + N** LLM calls (N = number of ranked jobs after filters, up to **`max_results`** 1–15, default **10**). |
| **Smart auto-apply** | `lib/smartApplyEngine.ts` → `runAutoApply` | Same engine as manual auto-apply; **same hidden structurer + deep-match loop**, driven by cron/user rules. |
| **Job finder third call** | `app/api/auto-jobs/route.ts` | If Adzuna returns jobs, an extra **`cachedAiGenerate`** fills **`match_reason`** per job (JSON array of strings). |
| **ATS “recheck”** | `lib/ats-resume-analysis.ts` | If `recheckAfterImprovement` is set, **longer** `ATS_RECHECK_PROMPT` + same resume slice (**15k** chars max) — still **one** `cachedAiGenerateContent` call, but **larger prompt** than base ATS. |
| **Cover letter path** | `app/api/generate-cover-letter/route.ts` | Uses **`geminiGenerateContent(fullPrompt)`** or **`chatCompletion`** — **not** `cachedAiGenerate*`, so **no `ai_cache` path** in this route; fallback differs from other endpoints. |

### Cache / accounting quirks (cost observability)

- **Deep match** uses `cacheFeature: "job_match"` (`lib/autoApplyEngine.ts`), same TTL bucket as **`/api/job-match`** (`lib/aiCache.ts`: `job_match` = **1 day**). Keys hash **full** `systemPrompt + userContent`, so **each (structured resume, job) pair** is unique → **low hit rate** in practice.
- **`cachedAiGenerate` without `cacheFeature`** (e.g. some recruiter routes) defaults feature to **`"general"`** → **24h** TTL (`lib/ai.ts`, `lib/aiCache.ts`).

---

## 5) Where the Previous Report Underestimated

| Issue | What was wrong | Corrected view |
|--------|----------------|----------------|
| **Auto-apply total** | Treated as “~2.1k tokens × N” and often omitted structurer | Add **structurer** call when `structured_json` is empty; deep-match **input is dominated by pretty-printed structured JSON**, not a short resume excerpt. |
| **Job finder** | Treated three sub-calls as ~2.3k tokens each on average | **AI-generated job list** must return **8–12** full job objects (`JOB_SEARCH_PROMPT`) → **output-heavy** (often **multiple k tokens** out). |
| **Interview prep** | Low total tokens | Input is tiny; **output** is large (many questions **with answers** in JSON). |
| **Resume improve** | Mid single-digit k tokens | **System prompt is very long**; user payload can include **~12k** chars resume + **~4k** JD + optional ATS feedback block. |
| **Single blended $/token** | Convenient but masks **output-heavy** calls | Provider pricing is **not** flat; output is often **several×** input price per token. Use **input/output split** for planning (below). |

**Rule of thumb used below:** rough conversion **~4 characters ≈ 1 token** for English prose; **JSON** often uses **more tokens per character** (brackets, quotes, repeated keys).

---

## 6) Corrected Token Envelopes (p50 vs heavy / p90-style)

Figures are **planning ranges** from code limits and prompt sizes, not provider tokenizers.

| Feature / step | Calls | p50-ish (input / output tokens) | Heavy (input / output) | Code anchors |
|------------------|------|----------------------------------|-------------------------|--------------|
| ATS analysis | 1 | 5.0k / 0.7k | 6.5k / 1.1k | `runAtsAnalysisFromText` slice **15k** chars; `ATS_BASE_PROMPT` / `ATS_RECHECK_PROMPT` |
| Resume improve | 1 | 9k / 3k | 14k / 4.5k | `safeResumeText.slice(0, 12000)` or 10k with feedback; JD **4k**; large `SYSTEM_PROMPT` |
| Job match | 1 | 3.8k / 0.8k | 4.8k / 1.2k | Resume **8k** + JD **6k** chars in `content` |
| Cover letter | 1 | 3.5k / 0.8k | 4.5k / 1.2k | JD **4k** + resume **6k** in `content`; `fullPrompt` for Gemini |
| Interview prep | 1 | 0.5k / 3.5k | 0.6k / 6k | `SYSTEM_PROMPT` large; **20** items with answers |
| Job finder | 3 | 4k+0.8k+1.2k in ≈ **6k**; out **1k+4k+0.5k** ≈ **5.5k** | Higher when Adzuna returns many jobs for match_reason | Skill **8k**; `generateAIJobs` 8–12 listings; optional third call |
| LinkedIn import | 1 | 4k / 2k | 5.5k / 3.5k | **12k** char slice |
| Public fresher resume | 1 | 2k / 2k | 4k / 3k | `cachedAiGenerate` |
| Resume structurer | 1 | 5k / 2k | 7k / 3.5k | `parsed_text.slice(0, 10000)` |
| Deep match (per job) | 1 | 5k / 1k | 9k / 1.5k | Full `JSON.stringify(structured, null, 2)` + job fields |
| Recruiter auto-shortlist (per batch of 10) | 1 | 9k / 1k | 14k / 1.5k | Job slices + 10 × **3k** resume chars |
| Recruiter screen one app | 1 | 3.5k / 0.8k | 6k / 1.2k | `app/api/recruiter/applications/[id]/screen/route.ts` |

---

## 7) Corrected “Tokens per User Action” Tables

### 7.1 Auto-apply run (main bottleneck)

**Parameters from code:** `max_results` default **10**, max **15** (`app/api/auto-apply/route.ts`).  
**Steps:** `getOrCreateStructuredResume` (if cold) + **`for` loop** `deepMatchJob` for **each** job in `salaryFiltered` (same length as ranked topN after filters) (`lib/autoApplyEngine.ts`).

| Scenario | Structurer | Deep matches (N) | Order-of-magnitude total tokens | Notes |
|----------|------------|--------------------|-----------------------------------|--------|
| Warm resume (structured_json exists), N=10 | 0 | 10 | **~55k–90k** | 10 × (deep match only) |
| Cold resume (first structured_json), N=10 | 1 | 10 | **~65k–105k** | +structurer |
| Max N=15, cold | 1 | 15 | **~95k–150k** | Worst “single user action” in job seeker flows |

**Assumption:** If `salaryFiltered` has fewer than `topN` jobs after salary filter, N drops → proportionally fewer deep matches.

### 7.2 Job finder (single POST)

| Step | Purpose | Approx. total tokens (p50) |
|------|---------|----------------------------|
| Skill extraction | JSON skills from resume | ~4.5k in + ~0.9k out |
| AI job suggestions | 8–12 synthetic jobs | ~0.8k in + **~3.5k–5k out** |
| Adzuna match reasons | JSON string array | ~1.2k in + ~0.5k out |
| **Sum** | | **~12k–18k** (often **above** the old ~6.9k figure) |

### 7.3 Recruiter auto-shortlist

- **BATCH_SIZE = 10** (`app/api/recruiter/jobs/[id]/auto-shortlist/route.ts`).  
- Applications count **A** → **ceil(A/10)** LLM calls.  
- Example **100** applicants → **10** batches × **~10k–16k** tokens each → **~100k–160k tokens** (order of magnitude), vs old **65k** flat estimate that did not always reflect large job context + resume slices.

---

## 8) Cost Model (More Realistic Than Single Blended $/Token)

### 8.1 Why split input vs output

Hosted APIs typically charge **output at a higher $/token** than input. A **single** blended rate systematically **underestimates** interview prep, AI job listings, improve-resume, and any large JSON outputs.

### 8.2 Illustrative planning prices (verify against your Google/OpenAI invoices)

Use as **order-of-magnitude** for Gemini Flash / GPT-4o-mini class models:

| | $ / 1M input tokens | $ / 1M output tokens |
|--|--------------------:|---------------------:|
| **Planning defaults (this doc)** | **$0.10** | **$0.40** |

**Cost formula:**

`Cost = (input_tokens × 0.10 + output_tokens × 0.40) / 1_000_000`

**Assumption:** Replace with your **actual** list prices; regional and batch discounts change totals.

### 8.3 Corrected cost per feature (p50-ish, one invocation each unless noted)

Using the p50 columns from section 6 and split pricing:

| Feature | ~Input tok | ~Output tok | ~Cost USD |
|---------|-----------:|------------:|----------:|
| ATS analysis | 5,000 | 700 | **$0.00078** |
| Resume improve | 9,000 | 3,000 | **$0.00210** |
| Job match | 3,800 | 800 | **$0.00070** |
| Cover letter | 3,500 | 800 | **$0.00067** |
| Interview prep | 500 | 3,500 | **$0.00145** |
| Job finder (3 calls combined, rounded) | 6,500 | 5,500 | **$0.00285** |
| Auto-apply (warm, N=10) | 50,000 | 10,000 | **$0.00900** |
| Auto-apply (cold, N=10) | 57,000 | 12,000 | **$0.01050** |

**Auto-apply (cold, N=10)** breakdown example: structurer ~5k/2k + 10× deep ~5k/1k → input ≈ 5k + 50k = 55k, output ≈ 2k + 10k = 12k (rounded).

---

## 9) Scale Recalculation (AI-Only, Illustrative)

### 9.1 “Power user” bundle per day (corrected)

One pass each: **ATS + job match + cover + job finder + one auto-apply run (warm, N=10)**.

| Block | ~Input | ~Output |
|-------|--------|---------|
| ATS | 5k | 0.7k |
| Job match | 3.8k | 0.8k |
| Cover | 3.5k | 0.8k |
| Job finder | 6.5k | 5.5k |
| Auto-apply warm N=10 | 50k | 10k |
| **Sum** | **~68.8k** | **~17.8k** |

**Cost per bundle (split pricing):**  
`(68800 × 0.10 + 17800 × 0.40) / 1e6` = **0.00688 + 0.00712** ≈ **$0.0140 / user / day** in AI alone.

**Old report** used ~36.3k **total** tokens with a **$0.45/M flat** rate → **~$0.016** — similar **USD** by coincidence, but for the **wrong reason**: token count was **too low** while the rate was **too high** versus typical input/output list pricing. If you keep **split** pricing and **correct** tokens, **dollar** estimates shift by scenario (output-heavy days cost more).

### 9.2 Daily active users (DAU) — AI variable only

Rough monthly AI spend **≈ DAU × 30 × cost_per_bundle** if every DAU runs that full bundle (unrealistic; use as stress test).

| DAU | ~$/month AI (stress bundle above) |
|-----|-----------------------------------:|
| 100 | **~$42** |
| 1,000 | **~$420** |
| 10,000 | **~$4,200** |

Add **auto-apply cold starts**, **N=15**, **recruiter shortlist**, and **smart-apply cron** to **push beyond** these.

---

## 10) Expensive Bottlenecks (Prioritized)

1. **`runAutoApply` deep-match loop** — **O(N)** LLM calls, large structured JSON in every request; **`max_results` up to 15**.  
2. **Recruiter auto-shortlist** — **O(applicants/10)** batched calls with **long** composite prompts.  
3. **`generateAIJobs` in `/api/auto-jobs`** — **Large JSON outputs** (8–12 jobs).  
4. **`getOrCreateStructuredResume`** — Paid once per resume until `structured_json` exists; affects **first** auto-apply and any code path that structures.  
5. **Interview prep** — **Output token** spike relative to input.  
6. **Resume improve** — Large prompts + large JSON output.

---

## 11) Production Cost Scenarios (Monthly, Broad Bands)

Infrastructure (Vercel, Supabase, egress, Adzuna) is unchanged in nature; **AI line** should be modeled from **feature mix**, not a flat DAU × single rate.

| Scenario | DAU (illustrative) | AI cost band (USD/mo) | Infra + DB (illustrative) | Total band |
|----------|-------------------:|------------------------:|--------------------------:|-----------:|
| Small | ~100 | **$50–$200** | $80–$200 | **$130–$400** |
| Medium | ~1,000 | **$300–$1,200** | $200–$600 | **$500–$1,800** |
| Large | ~10,000+ | **$2,500–$10,000+** | $500–$3,000+ | **$3k–$13k+** |

**Assumption:** Large band includes heavy auto-apply, recruiter screening, and limited cache hits.

---

## 12) Optimization Priorities (Aligned to Real Hotspots)

1. **Auto-apply:** Pass a **compact** resume representation to `deepMatchJob` (skills + top bullets) instead of full pretty JSON where quality allows; cap **`max_results`** by plan; consider **one** model call summarizing multiple jobs (higher complexity, lower repeat tokens).  
2. **Job finder:** Reduce **`JOB_SEARCH_PROMPT`** output (fewer synthetic jobs or shorter descriptions); cache by **skills hash**.  
3. **Interview prep:** Cap answer length; fewer questions per category for free tier.  
4. **Recruiter shortlist:** Lower per-candidate resume slice from **3000** chars if acceptable; batch smaller than 10 for huge queues with pagination.  
5. **Cover letter:** Optional: route through **`cachedAiGenerateContent`** with a cache feature to align with rest of stack (product decision).  
6. **Observability:** Log **`fromCache`** (`cachedAiGenerateWithMeta`) per feature in production metrics.

---

## 13) Architecture Overview

Unchanged in essence: Next.js API routes → Supabase (Auth, DB, Storage, Realtime) → `lib/ai` (Gemini + fallback + `ai_cache`). Cron via `/api/smart-apply/trigger` runs engines that **reuse the same LLM-heavy auto-apply path**.

---

## 14) Risk Notes

- **Pricing drift:** Replace illustrative **$0.10 / $0.40** with live provider numbers.  
- **Underestimation risk:** Any new **loop** or **batch** feature without token budgets will dominate bills.  
- **Stale docs:** `docs/ARCHITECTURE.md` may still mention providers not in `package.json`; **code** in `lib/gemini.ts` / `lib/openai.ts` is authoritative.

---

## Related documents

- **Executive / investor summary:** `docs/CODEBASE_AI_ARCH_COST_REPORT_INVESTOR.md` (aligned with v2 cost corrections)  
- **API ↔ LLM evidence matrix:** `docs/CODEBASE_AI_ARCH_COST_REPORT_APPENDIX.md`  

---

## Appendix A — Evidence Hotspots (Code Paths)

- `lib/autoApplyEngine.ts` — `deepMatchJob`, `runAutoApply`, `getOrCreateStructuredResume`  
- `lib/resumeStructurer.ts` — structuring prompt and **10k** char slice  
- `app/api/auto-jobs/route.ts` — three-call pipeline, **`generateAIJobs`** output size  
- `app/api/auto-apply/route.ts` — **`max_results`** 1–15, default 10  
- `app/api/recruiter/jobs/[id]/auto-shortlist/route.ts` — **BATCH_SIZE 10**, resume slices  
- `app/api/interview-prep/route.ts` — large JSON output contract  
- `app/api/improve-resume/route.ts` — prompt + slice sizes  
- `lib/aiCache.ts` — TTL by feature; **`job_match`** shared TTL for deep match  
- `lib/ats-resume-analysis.ts` — **15k** char resume slice  
