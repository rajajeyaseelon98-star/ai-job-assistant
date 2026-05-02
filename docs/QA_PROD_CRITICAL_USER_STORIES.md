# Production-critical user stories (E2E coverage)

**Goal:** Define a finite “100%” set of production-critical user stories and map each to at least one **real-user action+assert** Playwright spec (with best-effort handling where plan/credits/RLS can block full success).

**Last updated:** 2026-05-02

## Jobseeker stories

- **Auth/session works**
  - Covered by: `e2e/auth/real-login.setup.ts` (project `real-setup`)

- **Onboarding: upload resume text → ATS score screen**
  - Covered by: `e2e/real/onboarding.real.spec.ts` (project `real-onboarding-desktop`)

- **Quick Resume Builder → Resume Analyzer handoff**
  - Covered by: `e2e/real/jobseeker-resume-builder.real.spec.ts` (project `real-jobseeker-resume-builder-desktop`)

- **Resume Analyzer basic availability**
  - Covered by: `e2e/real/jobseeker-sitewide.real.spec.ts` (project `real-jobseeker-sitewide-desktop`)

- **Job Match (AI)**
  - Covered by: `e2e/real/job-match-tailor.real.spec.ts` (project `real-jobseeker-jobmatch-tailor-desktop`) — best-effort for plan/credits

- **Tailor Resume (AI improve-resume in tailor mode)**
  - Covered by: `e2e/real/job-match-tailor.real.spec.ts` (project `real-jobseeker-jobmatch-tailor-desktop`) — best-effort for plan/credits

- **Cover Letter generation + history entry**
  - Covered by: `e2e/real/jobseeker-cover-letter-improve.real.spec.ts` (project `real-jobseeker-cover-letter-improve-desktop`) — best-effort for plan/credits

- **Improve Resume + history entry**
  - Covered by: `e2e/real/jobseeker-cover-letter-improve.real.spec.ts` (project `real-jobseeker-cover-letter-improve-desktop`) — best-effort for plan/credits

- **Auto-Apply run + UI loads**
  - Covered by: `e2e/real/jobseeker-auto-smart-apply.real.spec.ts` (project `real-jobseeker-auto-smart-apply-desktop`) — best-effort for plan limits

- **Smart Auto-Apply rule create/toggle + UI loads**
  - Covered by: `e2e/real/jobseeker-auto-smart-apply.real.spec.ts` (project `real-jobseeker-auto-smart-apply-desktop`) — best-effort for plan limits

- **LinkedIn import**
  - Covered by: `e2e/real/linkedin-import.real.spec.ts` (project `real-jobseeker-linkedin-import-desktop`) — best-effort for credits

- **History drilldown visibility**
  - Covered by: `e2e/real/jobseeker-history-drilldown.real.spec.ts` (project `real-jobseeker-history-drilldown-desktop`)

- **Messages: open thread + unread clears**
  - Covered by: `e2e/real/jobseeker-messages-readsync.real.spec.ts` (project `real-jobseeker-messages-readsync-desktop`) — best-effort when there are no unread messages

- **Settings: update name + verify preferences persistence**
  - Covered by: `e2e/real/jobseeker-settings.real.spec.ts` (project `real-jobseeker-settings-desktop`)

- **Applications tracker reflects recruiter stage updates**
  - Covered by: `e2e/real/marketplace.real.spec.ts` (project `real-marketplace-desktop`)

## Recruiter stories

- **Recruiter onboarding: create company (or redirect if already created)**
  - Covered by: `e2e/real/onboarding.real.spec.ts` (project `real-onboarding-desktop`)

- **Jobs: create draft job**
  - Covered by: `e2e/real/recruiter-jobs-crud.real.spec.ts` (project `real-recruiter-jobs-crud-desktop`)

- **Jobs: edit job (`/recruiter/jobs/:id`) and save**
  - Covered by: `e2e/real/recruiter-job-edit.real.spec.ts` (project `real-recruiter-job-edit-desktop`)

- **Applications pipeline: move candidate to shortlisted via UI**
  - Covered by: `e2e/real/recruiter-applications-ui-stage.real.spec.ts` (project `real-recruiter-applications-ui-stage-desktop`)

- **Messaging: cross-role message delivery (recruiter → jobseeker)**
  - Covered by: `e2e/real/messages.real.spec.ts` (project `real-messages-desktop`)

- **Templates: create + list**
  - Covered by: `e2e/real/recruiter-templates-alerts-invites.real.spec.ts` (project `real-recruiter-templates-alerts-invites-desktop`)

- **Alerts: create + list**
  - Covered by: `e2e/real/recruiter-templates-alerts-invites.real.spec.ts` (project `real-recruiter-templates-alerts-invites-desktop`)

- **Invite accept: UI route exists and resolves**
  - Covered by: `app/(recruiter)/recruiter/invite/accept/page.tsx`
  - Regression covered by: `e2e/real/recruiter-invite-accept-ui.real.spec.ts` (project `real-recruiter-invite-accept-ui-desktop`)

- **Candidates: open candidate list + profile**
  - Covered by: `e2e/real/recruiter-candidates.real.spec.ts` (project `real-recruiter-candidates-desktop`) — best-effort if no candidates exist

- **Recruiter AI: optimize job + auto-shortlist**
  - Covered by: `e2e/real/recruiter-job-ai.real.spec.ts` (project `real-recruiter-job-ai-desktop`) — best-effort for credits/plan

- **Marketplace loop: recruiter posts job → seeker applies → recruiter shortlists → seeker sees status**
  - Covered by: `e2e/real/marketplace.real.spec.ts` (project `real-marketplace-desktop`)

## Site-wide route render guarantees

- **Jobseeker site-wide render health (major routes)**
  - Covered by: `e2e/real/jobseeker-sitewide.real.spec.ts` (project `real-jobseeker-sitewide-desktop`)

- **Recruiter site-wide render health (major routes)**
  - Covered by: `e2e/real/recruiter-sitewide.real.spec.ts` (project `real-recruiter-sitewide-desktop`)

## Notes / exclusions for “100%”

- **Dynamic public routes** (`/jobs/:slug`, `/u/:slug`, `/results/:token`, `/share/:token`, `/salary/:slug`) are covered in real-user mode by `e2e/real/public-dynamic.real.spec.ts`, but they inherently rely on data setup + RLS and are validated as “page renders with best-effort assertions”.
- **Plan/credit gated AI actions** are treated as “pass if success OR expected upgrade/credit limit UI appears”.

