# AI Job Assistant — Investor & Founder Summary

**Companion:** Full technical report in `docs/CODEBASE_AI_ARCH_COST_REPORT.md`. API evidence matrix in `docs/CODEBASE_AI_ARCH_COST_REPORT_APPENDIX.md`.

---

## What it is

A dual-sided hiring platform: **job seekers** get resume intelligence, job discovery, assisted/auto-apply, and career analytics; **recruiters** get postings, ATS-style pipeline, candidate search, messaging, and AI-assisted screening and job copy. The product is built as a **single Next.js codebase** on **Supabase** (Auth, Postgres, Storage, Realtime) with **usage-based AI** (Gemini primary, OpenAI fallback) and **server-side caching** to control inference cost.

---

## Product moat (from implementation, not marketing)

- **Data + graph:** Structured resumes, `candidate_skills`, skill demand aggregates, application outcomes feeding **non-LLM** scoring (interview probability, hiring prediction heuristics).
- **Workflow depth:** Auto-apply and smart-apply create a sticky loop versus one-off resume tools.
- **Two-sided network:** Messaging, applications to recruiter jobs, and recruiter tools increase switching cost once employers adopt.

---

## Unit economics (AI)

**Correction (v2):** The first cost draft **under-counted tokens** by missing (1) **`getOrCreateStructuredResume`** before auto-apply when `structured_json` is empty, (2) **large JSON outputs** (e.g. job finder “8–12 AI jobs”, interview prep), and (3) **deep-match** inputs dominated by **full structured resume JSON** per job—not a short text snippet. See **`docs/CODEBASE_AI_ARCH_COST_REPORT.md`** §5–9.

**Planning model:** Use **split** input/output pricing (e.g. **~$0.10/M in**, **~$0.40/M out** as illustrative for Flash / mini-class models—replace with live invoices), not a single blended $/token for output-heavy features.

| Metric | Order of magnitude |
|--------|-------------------|
| Same “power user” bundle per day (ATS + match + cover + job finder + **one warm** auto-apply **N=10**) | **~** **87k** **total tokens** (~69k in + ~18k out) → **~$0.014** / day at illustrative split rates above |
| First-time auto-apply (cold structurer + N=10) | **+~7k–10k** tokens vs warm |
| Heaviest flows | **Auto-apply** (up to **15** deep matches + structurer), **recruiter auto-shortlist** (ceil(A/10) large batches), **job finder** (3 calls, fat JSON out) |

**Implication:** Per-user AI cost stays manageable at light usage; **margins compress** when DAU routinely runs **full** auto-apply, **smart-apply** cron, or **bulk** recruiter screening. **Output tokens** drive dollars as much as input.

---

## Scale scenarios (illustrative monthly)

Non-AI fixed stack (hosting + Supabase + egress) is often **$100–$600** early, **$500–$3k+** at real traction. Combined with AI:

| Scale | Daily active (illustrative) | Total monthly (AI + infra ballpark) |
|-------|-----------------------------|-------------------------------------|
| Small | ~100 | **~$130–$400** |
| Medium | ~1,000 | **~$500–$1,800** |
| Large | ~10,000+ | **~$3k–$13k+** |

These are planning ranges, not forecasts. Real spend depends on **feature mix**, **cache hit rate**, and **Adzuna/third-party** usage.

---

## Risks

- **AI cost variance:** Loop features dominate; need product guardrails (limits, batch size, model tier).
- **Doc vs code drift:** Some older architecture docs mention providers not present in `package.json`; operational truth is **Gemini + OpenAI** in `lib/gemini.ts` / `lib/openai.ts` / `lib/ai.ts`.
- **Compliance & trust:** Resume and employer data; RLS and service-role paths must stay audited as you scale.

---

## What to watch in diligence

1. **Usage logs** vs **revenue tiers** — are power users subsidized?
2. **Cache hit ratio** by feature (`ai_cache`) — is cost control working?
3. **Cron / smart-apply** volume — automated applies multiply token + support risk.
4. **Recruiter AI** batch sizes — shortlist is a cost multiplier.

---

## Suggested narrative for pitch deck (one slide)

**“We monetize a full-stack hiring workflow on Supabase; AI is a variable-cost layer with caching and fallback. Gross margin scales if we gate looped AI (auto-apply, bulk screen) and monetize recruiter seats.”**
