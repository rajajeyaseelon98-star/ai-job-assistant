# Product strategy & UX — reference (aligned with docs)

**Purpose:** Single narrative for positioning, focus, and UX priorities. **Update this file** when strategy or major UX decisions change. Cross-references `KNOWLEDGE_TRANSFER.md`, `FEATURES_FLOW.md`, and `TEST_CASES.md`.

**Last updated:** 2026-03-07

### Recently implemented (code)

- **Dashboard:** **Start here** (3-step checklist with dismiss), **Product narrative banner** (3× interviews + CTA), **Explore more** grid; core loop = Analyzer → Match → Auto-Apply.
- **Topbar:** In-product line — *Up to 3× more interviews — we help you apply, not only advise.*
- **Sidebar:** **Start here** · **Explore more** (merged secondary tools) · **Advanced** (LinkedIn) · **Track & insights**.
- **Improved resume:** `normalizeImprovedResumeContent` + **five fixed sections** always shown in **ImprovedResumeView** (with recovery copy when empty); improve/LinkedIn APIs normalize output; human-friendly API errors (`lib/friendlyApiError.ts`).
- **Smart Auto-Apply:** Plan/limit strip from `/api/usage` (free vs Pro, 24h cadence, monthly `smart_apply` count).
- **Job Finder:** Phase 2+ roadmap copy (recruiter / platform jobs).
- **Loaders:** Shared **`PageLoading`** (`default` / `dense` / `dashboard`) for route skeletons.
- **Login / Signup:** Copy “Signing you in…”, “Signing you up…”, “Creating your account…”; disable inputs while loading; signup tagline ties to outcome.
- **Resume Analyzer:** Tabs **Upload PDF/DOCX** vs **Paste resume text**; optional job fields include **Tailor for this job** vs **Polish my current path** (`tailorIntent` → `/api/improve-resume`).
- **Improve API:** `tailorIntent`: `target_job` | `optimize_current`; prompts broadened beyond “software developers”.
- **Re-analyze CTA:** Primary card — **“See your new ATS score →”**.
- **Upload resume / Tailor:** Friendly errors when PDF parse fails; tailor page prefill from Job Match via `sessionStorage`.
- **Job Match:** Copy distinguishes **gap analysis** vs **Resume Tailoring**; **“Fix this with AI — Tailor resume”** CTA → `/tailor-resume` with prefill.
- **Job Finder results:** Trust line explaining **source** labels (Adzuna vs AI Suggested).
- **Cover letter / Interview prep API:** Prompts explicitly include non-tech roles.
- **Smart Auto-Apply:** Subtitle **“Set once → we apply daily for you.”** + usage/limit strip (see above).
- **Quick Resume Builder:** `/resume-builder` wizard → **Open in Resume Analyzer** (draft via `sessionStorage`); protected in middleware; **Settings → Advanced** links here + LinkedIn import.
- **LinkedIn import:** Moved out of primary “Improve”; **Advanced** nav + optional banner on `/import-linkedin`.
- **AI Auto-Apply cards:** **Direct apply (our platform)** vs **External apply** (`apply_channel` + copy on `/auto-apply`).
- **Application tracker:** Kanban columns, drag-and-drop, extended stats + conversion line, richer empty state with links.

---

## 1. Core positioning (north star)

| ❌ Avoid (feature list) | ✅ Lead with (outcome) |
|-------------------------|-------------------------|
| “AI job assistant with many features” | **“Get 3x more interviews — we help you apply automatically”** |

**Docs alignment:**

- `KNOWLEDGE_TRANSFER.md` §1 already notes **Core Hook Refocus** and landing copy **“Get 3x More Interviews Using AI”** — marketing direction matches this doc.
- `FEATURES_FLOW.md` correctly documents **many** flows (auto-apply, smart-apply, tailoring, tracker, streaks, recruiter, SEO, etc.) — **implementation breadth ≠ user-facing simplicity.** Navigation and onboarding must funnel users into the **winning flow** (§5 below), not expose every feature equally.

**Risk:** Feature surface in KT/FEATURES_FLOW can **feel** like the product is “everything for everyone.” **Mitigation:** Primary nav + dashboard = **Start flow** only; advanced items labeled secondary or “More.”

---

## 2. Winning user flow (what to optimize for)

1. **Upload resume** (or paste — must be obvious).
2. **See ATS score + gaps** (trust + clarity).
3. **Fix resume** (improve / tailor with clear intent).
4. **Apply** (auto-apply / applications — **USP: we don’t only advise, we apply**).

Everything else is **supporting** or **Phase 2+**.

**Docs alignment:**

- `FEATURES_FLOW.md` §1–3, §8 (Auto-Apply) describe pieces of this; **order and emphasis in the UI** are separate from doc completeness.
- `TEST_CASES.md` TC for onboarding, auto-apply, hero — use these to **gate** releases (e.g. “first session completes steps 1→4”).

---

## 3. Critical UX issues — map to docs & intended fixes

| Area | Problem (summary) | Doc where behavior is described | Product / UX direction |
|------|-------------------|----------------------------------|------------------------|
| **Login / Signup** | Slow feel; weak loading feedback | `FEATURES_FLOW.md` §1; `TEST_CASES.md` (buttons disabled, loading) | Full-screen or inline copy: **“Signing you in…”**, **“Creating your account…”**; disable primary button after click; avoid double submit. |
| **Resume Analyzer** | Paste hidden; users expect paste | `FEATURES_FLOW.md` §2 Option B | **Two clear tabs or sections:** Upload PDF/DOCX · Paste text (above the fold). |
| **Resume / Improve / Tailor** | Job context vs “current role” unclear | `FEATURES_FLOW.md` §3–4, §10 | **Toggle or explicit mode:** “Optimize for my current role” vs **“Tailor for this job / switch career”** so prompts match intent (fixes React resume + Sales JD confusion). |
| **Re-analyze after improve** | CTA placement | §3 Resume Improvement in FEATURES_FLOW | After improvement, primary CTA: **“See your new ATS score →”** (one obvious next step). |
| **Resume Tailoring** | PDF parse fails | `FEATURES_FLOW.md` §2 (upload path) | **Fallback copy + action:** “We couldn’t read this PDF — try DOCX or **paste your text**.” Never dead-end. |
| **Tailoring output** | Messy / missing sections | §10, `ImprovedResumeContent` in types | Enforce **fixed sections** in UI + prompts: Summary, Skills, Experience, Projects, Education. |
| **Job Match vs Tailoring** | Feels duplicate | §4 vs §10 FEATURES_FLOW | **Differentiate in UI copy:** Job Match = **score + gap analysis**; Tailoring = **rewritten resume**. CTA from Match → **“Fix this with AI → Tailor resume.”** |
| **Cover letter / Interview prep** | “Only tech” bias | §5–6 FEATURES_FLOW, API prompts | **Prompt audit:** explicit support for non-tech (Teacher, Sales, HR, etc.) in system instructions + tests in TEST_CASES. |
| **Auto Job Finder** | “AI suggested” = low trust | §7 FEATURES_FLOW | **Source labels:** e.g. “From Adzuna”, “From our platform”, “Curated” — never anonymous “AI suggested” without source. |
| **Jobs strategy** | External vs internal | §7–8 KT / FEATURES_FLOW | **Phase 1:** External (e.g. Adzuna) with clear labeling. **Phase 2:** More internal / recruiter jobs. **Long-term:** own inventory reduces confusion. |
| **AI Auto-Apply** | External vs internal mixed | §8 FEATURES_FLOW | Labels: **Direct apply (our platform)** vs **External apply** (opens partner site). |
| **Smart Auto-Apply** | Unclear value | §9 KT | Pro-only is fine; copy: **“Set once — we apply daily for you”** + limits visible. |
| **LinkedIn Import** | Heavy for early users | §11 FEATURES_FLOW | **Defer or hide** for v1; replace with **“Complete your profile”** post-signup (lighter funnel). |
| **Application Tracker** | Pipeline unclear | §12 FEATURES_FLOW | Evolve toward **Kanban**: Saved → Applied → Interview → Offer → Rejected; counts + optional conversion %. |
| **Loaders** | Inconsistent | TEST_CASES (spot checks) | **Standard:** skeleton or explicit message for login, signup, analyze, match, apply, tailor. |
| **Errors** | Raw technical messages | TEST_CASES error cases | Replace with **human + recovery:** “We couldn’t read your file — try DOCX or paste text.” |

---

## 4. What to add (high impact)

| Item | Why | Doc touchpoint |
|------|-----|----------------|
| **Resume Builder** (structured wizard) | Most users lack a strong resume; increases completion | New section in FEATURES_FLOW when built; KT §6 pages |
| **Single “Start” or guided flow** | Reduces paralysis | Onboarding §1 FEATURES_FLOW; TEST_CASES TC-1.5 |
| **Loaders everywhere** | Trust + perceived performance | TEST_CASES checklist expansion |
| **Friendly error + recovery** | Conversion on failure paths | TEST_CASES + component copy |

---

## 5. What to remove / simplify (early-stage focus)

| Item | Action |
|------|--------|
| LinkedIn import | Later / settings / “Advanced” |
| Deep analytics for new users | Secondary nav or post-activation |
| Career Coach, Skill Demand (in-app) | SEO pages OK; **in-app** = later or one entry point |
| Salary insights | Secondary until core loop converts |

**KT §1** lists many capabilities — **product strategy** should decide what the **default dashboard** shows vs “Explore more.”

---

## 6. Honest verdict (strategy doc, not a code audit)

| Strength (docs + build) | Gap (UX / narrative) |
|-------------------------|------------------------|
| Strong backend, flows documented end-to-end | Too many **equal** features in nav — **needs hierarchy** |
| Auto-apply / smart-apply / learning engine story is powerful | **First-time user** doesn’t see a single path |
| “3x interviews” hook exists in marketing copy | **In-product** copy and IA must repeat the same promise |

---

## 7. When to update this document

- Repositioning or renaming the product.
- Adding/removing a **primary** user flow.
- Changing job sources (Adzuna-only → mixed → internal-first).
- Any decision that affects **default** dashboard, nav, or onboarding.

**Related:** `KNOWLEDGE_TRANSFER.md` (what the system *does*), `FEATURES_FLOW.md` (how flows connect), `TEST_CASES.md` (what to verify). This file is **why** and **what matters first** for users.
