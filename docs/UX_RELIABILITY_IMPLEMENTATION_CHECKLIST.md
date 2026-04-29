# UX Reliability Implementation Checklist (File-by-File)

Date: 2026-04-26  
Goal: Implement trust/clarity fixes with exact code touchpoints.

## Execution Status (2026-04-27)
- Sprint 1: Implemented
- Sprint 2: Implemented
- Sprint 3: Implemented
- Cross-cutting API contract updates: Implemented for core jobseeker + recruiter AI routes
- Verification: `npm run build` passing (includes lint + typecheck)

---

## Sprint 1 (Highest Impact, User Trust)

## 1) Shared Feedback Pattern

### Create
- `components/ui/ActionStatusBanner.tsx`
  - Success / warning / error variants.
- `components/ui/InlineRetryCard.tsx`
  - Message + Retry + Alternate action.
- `components/ui/ActionReceiptCard.tsx`
  - “Done” confirmation + CTA.
- `lib/ui-feedback.ts`
  - `toUiFeedback(error)` + common message normalization.

### Update
- `lib/client-ai-error.ts`
  - Extend to include `retryable`, `requestId` parsing support.
- `lib/api-error.ts`
  - Ensure `requestId` and `nextAction` fields are parsed if present.

Acceptance:
- All targeted features below use shared components (no ad-hoc alert-only UX).

---

## 2) Resume Analyzer UX Reliability

### Update
- `app/(dashboard)/resume-analyzer/page.tsx`
  - Add explicit stage states: `uploading`, `analyzing`, `saving`.
  - Use `ActionReceiptCard` after successful analysis: “Saved to history”.
  - Replace generic inline errors with `InlineRetryCard`.
  - Add clear next-step CTAs (`Improve resume`, `View history`).

- `hooks/mutations/use-analyze-resume.ts`
  - Normalize mutation errors and include retryable metadata.
  - Keep payloads consistent for `_usage`.

- `hooks/mutations/use-improve-resume.ts`
  - Add stage-aware mutation status (optional extended return type).

Acceptance:
- User always knows if action succeeded, where to find result, and what to do next.

---

## 3) Cover Letter Reliability

### Update
- `components/cover-letter/CoverLetterForm.tsx`
  - Add source badge (“Using improved resume / uploaded resume / pasted text”).
  - Show success receipt + “Open history”.
  - Add retry with preserved form values.

- `app/api/generate-cover-letter/route.ts`
  - Keep `detail` field for 500.
  - Add `meta.savedId` and `meta.savedAt` on success response.

- `hooks/mutations/use-generate-cover-letter.ts`
  - Surface backend `detail` through normalized UI feedback safely.

Acceptance:
- No generic dead-end error; users always get recovery path.

---

## 4) Auto Apply Trust UX

### Create
- `components/auto-apply/AutoApplyRunTimeline.tsx`
  - `queued -> finding jobs -> matching -> ready`.
- `components/auto-apply/AutoApplyRunReceipt.tsx`
  - Applied count, skipped count, failed count.

### Update
- `components/auto-apply/AutoApplyResults.tsx`
  - Show partial-failure warnings per job.
  - Add “Retry failed subset” action.

- `hooks/queries/use-auto-apply.ts`
  - Expose richer run status model and summary fields.

- `app/api/auto-apply/[id]/route.ts` (and related status endpoints)
  - Return `currentStep`, `processedCount`, `failedCount`, `failedItems`.

Acceptance:
- User can track run progress and understand partial outcomes clearly.

---

## 5) Smart Apply Transparency

### Create
- `components/smart-apply/SmartApplyRunHealthCard.tsx`
  - Last run, next run, last outcome reason.

### Update
- `app/(dashboard)/smart-apply/page.tsx`
  - Display no-result diagnostics (why 0 jobs applied).
  - Add “Run now” CTA (if business permits).

- `hooks/queries/use-smart-apply.ts`
  - Include run summary fields from API.

- `app/api/smart-apply/rules/route.ts` (and related run endpoints)
  - Return last execution metadata and reason codes.

Acceptance:
- Users no longer wonder whether smart apply is working.

---

## Sprint 2 (Recruiter Flow Trust)

## 6) Recruiter Job Create/Edit + Optimize

### Update
- `app/(recruiter)/recruiter/jobs/new/page.tsx`
- `app/(recruiter)/recruiter/jobs/[id]/page.tsx`
- `app/(recruiter)/recruiter/jobs/[id]/optimize/page.tsx`
  - Add save/publish receipts.
  - Add before/after diff block for optimize output.
  - Add explicit failure reason + retry.

- `hooks/queries/recruiter-mutations.ts`
  - Normalize mutation return shape and errors.

Acceptance:
- Recruiter sees what changed, what saved, and next action.

---

## 7) Recruiter Screening / Auto-Shortlist / Skill Gap

### Create
- `components/recruiter/BatchScreeningReport.tsx`
  - Candidate status: success/skipped/failed + reason.

### Update
- `app/(recruiter)/recruiter/jobs/[id]/auto-shortlist/page.tsx`
- `app/(recruiter)/recruiter/skill-gap/page.tsx`
- `app/(recruiter)/recruiter/candidates/[id]/page.tsx`
  - Add itemized result reporting and retry buttons.

- `app/api/recruiter/jobs/[id]/auto-shortlist/route.ts`
  - Return itemized batch summary.

Acceptance:
- Recruiter can trust shortlist output and diagnose skips/fails.

---

## Sprint 3 (Messaging + Usage Confidence)

## 8) Messaging Delivery Confidence

### Create
- `components/messages/MessageDeliveryState.tsx`
  - Sending / Sent / Read / Failed.
- `components/messages/RealtimeHealthBadge.tsx`
  - Connected / delayed fallback status.

### Update
- `components/messages/MessagesInbox.tsx`
  - Replace any silent failure with inline retry state.

- `app/api/messages/route.ts`
  - Return send metadata (`messageId`, `sentAt`, optional `notificationQueued`).

Acceptance:
- User always knows message outcome and sync health.

---

## 9) Usage Dashboard Confidence

### Create
- `components/usage/UsageHealthChip.tsx`
  - “Tracking healthy / degraded”.

### Update
- `app/(dashboard)/usage/page.tsx`
  - Show `generatedAt` and last refresh.
  - If API error, display actionable diagnostics (not silent zeros).

- `app/api/usage/summary/route.ts`
- `app/api/usage/history/route.ts`
- `app/api/usage/feature-breakdown/route.ts`
  - Include `meta.generatedAt`, `requestId`.

Acceptance:
- Usage data feels auditable and reliable.

---

## Cross-Cutting API Contract Improvements

Apply to all mutation-heavy routes:
- Return:
  - `ok`
  - `message`
  - `meta.nextStep`
  - `meta.requestId`
  - `retryable` on error responses

Primary files (incremental):
- `app/api/analyze-resume/route.ts`
- `app/api/improve-resume/route.ts`
- `app/api/job-match/route.ts`
- `app/api/generate-cover-letter/route.ts`
- `app/api/auto-jobs/route.ts`
- `app/api/interview-prep/route.ts`
- Recruiter AI routes under `app/api/recruiter/**`

---

## QA Execution Checklist Per PR

1. Run lint + typecheck.
2. Verify happy path + one fail path for edited feature.
3. Confirm:
   - success confirmation visible
   - result persistence visible
   - retry exists for retryable errors
   - clear next-step CTA exists
4. Validate no raw internal errors shown in UI.

---

## Ownership Suggestion

- **Frontend UX reliability components:** Frontend engineer
- **API response normalization:** Full-stack engineer
- **Error taxonomy + observability:** Backend/platform
- **Scenario QA + acceptance signoff:** QA lead

