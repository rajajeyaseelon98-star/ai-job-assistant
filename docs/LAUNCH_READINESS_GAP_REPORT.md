# Launch Readiness Gap Report

Date: 2026-04-26  
Scope: Full app audit (job seeker + recruiter + AI/usage/credits + docs)

---

## 1) Executive Summary

- Product is feature-rich and mostly connected end-to-end for core AI workflows.
- Largest launch blockers are around commercial readiness and a few flow-integration inconsistencies.
- AI usage + credits system is now technically in place, but requires strict environment/migration discipline across deployments.

---

## 2) Priority Gaps

## 🔴 Critical (must fix before launch)

### C1. Billing/upgrade flow not fully operational
- **Problem:** Pricing UX is present, but full subscription execution path is not clearly complete end-to-end (checkout -> webhook -> plan sync -> UX confirmation).
- **User impact:** Users can see upgrade prompts but may not complete real plan changes reliably.
- **Owner:** Backend + Product Engineer
- **Effort:** L
- **Risk:** High revenue/blocker risk
- **Acceptance criteria:**
  - User can purchase/upgrade from pricing page.
  - Webhook updates plan in DB.
  - Plan reflected immediately in UI and feature gating.
  - Failed payment flow provides recoverable UX.

### C2. Release guardrail for AI usage tracking not enforced
- **Problem:** `ai_usage` reliability depends on migrations + grants + env configuration.
- **User impact:** Usage dashboard can silently appear empty or fail in misconfigured envs.
- **Owner:** Platform/DevOps
- **Effort:** M
- **Risk:** High operational risk
- **Acceptance criteria:**
  - Deployment checklist includes both usage migrations.
  - Startup/health check verifies `ai_usage` read+insert access.
  - One smoke test proves non-zero usage row after a test AI call.

---

## 🟠 Important (strong UX / quality impact)

### I1. Daily action deep-link intent mismatch
- **Problem:** Some action routes do not point to the most direct user destination for intent completion.
- **Owner:** Frontend
- **Effort:** S
- **Risk:** Medium
- **Acceptance criteria:**
  - Each daily action opens the exact completion context (not adjacent page).
  - Tracked completion rate improves vs baseline.

### I2. API capabilities not fully surfaced in primary UX
- **Problem:** Some intelligence-style APIs appear underutilized in top-level journeys.
- **Owner:** Product + Frontend
- **Effort:** M
- **Risk:** Medium
- **Acceptance criteria:**
  - Every kept endpoint has a clear user-facing entry point.
  - Unused endpoints are deprecated or documented as internal-only.

### I3. Feedback/retry consistency across flows
- **Problem:** UX error/success handling still varies across pages.
- **Owner:** Frontend
- **Effort:** M
- **Risk:** Medium
- **Acceptance criteria:**
  - Common feedback pattern (loading/success/error/retry) used for all mutation-heavy pages.
  - No blocking/browser-native alerts for core user actions.

---

## 🟡 Nice to Have

### N1. Consolidate and retire API-only paths
- **Problem:** Some routes look API-only and not product-facing.
- **Owner:** Backend
- **Effort:** S
- **Risk:** Low
- **Acceptance criteria:**
  - Endpoint inventory marked: public, internal, deprecated.
  - Deprecated routes removed or feature-flagged.

### N2. Add richer post-action confirmations
- **Problem:** Some high-impact actions can use stronger confirmation + next-step cues.
- **Owner:** UX + Frontend
- **Effort:** S
- **Risk:** Low
- **Acceptance criteria:**
  - Core actions show confirmation + actionable next step.
  - Reduced support/debug questions on action outcomes.

---

## 3) Feature Coverage Snapshot

- **Job seeker:** strong (resume analysis/improve/match, cover letter, auto-apply, smart-apply, messaging, analytics, usage dashboard).
- **Recruiter:** strong (jobs, candidates, screening, shortlist, messaging, company profile, analytics).
- **AI backbone:** strong (provider fallback, caching, prompt guardrails, token/credit tracking, enforcement hooks).
- **Platform hardening:** improved (usage diagnostics, explicit error detail, grants migration for `ai_usage`).

---

## 4) Launch Gate Checklist

- [ ] Billing checkout + webhook + plan sync verified in staging and prod.
- [ ] `ai_usage` migrations applied in target envs.
- [ ] Usage API smoke test returns non-zero after one AI action.
- [ ] Credits exhaustion flow returns 402 and shows upgrade CTA in UI.
- [ ] Core user journeys pass manual QA:
  - [ ] Analyze resume
  - [ ] Improve resume
  - [ ] Generate cover letter
  - [ ] Run auto-apply
  - [ ] Recruiter screen/shortlist
- [ ] Documentation synced (`PROJECT_ANALYSIS_REPORT`, `AI_FEATURES_PROMPT_ANALYSIS_REPORT`, `TEST_CASES`, `KNOWLEDGE_TRANSFER`).

---

## 5) Recommended Sprint Plan

### Sprint A (Launch blockers)
- C1 Billing end-to-end
- C2 Usage tracking release guardrail

### Sprint B (UX reliability)
- I1 Daily-action route alignment
- I3 Feedback/retry consistency

### Sprint C (Platform hygiene)
- I2 Endpoint-to-UX mapping cleanup
- N1/N2 polish and deprecation pass

