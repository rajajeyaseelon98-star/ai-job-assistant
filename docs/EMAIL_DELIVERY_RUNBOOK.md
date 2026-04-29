# Email Delivery Runbook

## Scope

Email flows currently covered:

- Company invite emails
- Candidate applied -> recruiter notifications
- Recruiter stage update -> candidate notifications

Delivery is best-effort and must never block core user actions.

## Required Environment Variables

- `EMAIL_ENABLED=true`
- `EMAIL_INVITES=true`
- `EMAIL_MARKETPLACE_EVENTS=true`
- `RESEND_API_KEY=<provider key>`
- `EMAIL_FROM=<verified sender>`
- `NEXT_PUBLIC_APP_URL=<public app url>`
- `RESEND_WEBHOOK_SECRET=<whsec_... signing secret for Resend webhook>`
- `CRON_SECRET=<random secret for Vercel Cron>`
- Optional: `INTERNAL_CRON_SECRET=<legacy secret for manual retry calls>`
- Optional: `EMAIL_MAX_RECIPIENTS_PER_EVENT=25`

## Delivery Logging

Logs are stored in `public.email_logs` with:

- `status`: `queued | sent | skipped | failed`
- `error_code`, `error`, `retryable`, `attempt_count`, `next_retry_at`
- `idempotency_key` for dedupe
- `meta.payload` used for replay

Use this table as the source of truth for production diagnostics.

## Retry Job

Internal endpoint:

- `GET /api/internal/email-retry?limit=30` (Vercel Cron)
- `POST /api/internal/email-retry` (manual)
- Auth:
  - Vercel Cron: `Authorization: Bearer <CRON_SECRET>` (Vercel auto-injects this header)
  - Manual/internal: `Authorization: Bearer <INTERNAL_CRON_SECRET>` or `x-internal-cron-secret: <INTERNAL_CRON_SECRET>`

Behavior:

- Replays failed+retryable emails (`attempt_count < 3`)
- Preserves best-effort architecture
- Writes new rows into `email_logs` for each retry attempt
- Writes a heartbeat row into `public.email_job_runs` for operational visibility

## Delivery Lifecycle (Webhooks)

Webhook endpoint:

- `POST /api/webhooks/resend`
- Verifies Svix signature headers (`svix-id`, `svix-timestamp`, `svix-signature`) using `RESEND_WEBHOOK_SECRET`

Behavior:

- Updates `public.email_logs` rows by `provider_message_id` (`data.email_id`) with:
  - `delivery_status`: `delivered | bounced | complaint`
  - timestamps: `delivered_at | bounced_at | complained_at`
  - `webhook_last_event`, `webhook_last_at`

## Alerting Guidance

Track and alert on:

- failure ratio (`failed / (sent + failed)`) over 5m/15m windows
- repeated `error_code=PROVIDER_ERROR`
- sustained backlog where `status='failed'` and `next_retry_at < now()`
- cron heartbeat missing: no `email_job_runs` rows for `job_name='email_retry'` in expected window

Suggested starting thresholds:

- warning: failure ratio > 5%
- critical: failure ratio > 15%
- warning: backlog > 100 rows pending retry
- warning: no cron run in last 20 minutes

## Incident Triage Checklist

1. Confirm env vars are set in active deployment scope.
2. Verify sender domain authentication (SPF/DKIM/DMARC) in provider.
3. Check provider dashboard for outages/rate limits.
4. Inspect `public.email_job_runs` (latest summary + last run time).
5. Inspect `public.email_logs` for dominant `error_code` / recipients / events.
6. Trigger controlled replay via `/api/internal/email-retry`.
6. If needed, temporarily disable category flags (`EMAIL_INVITES` or `EMAIL_MARKETPLACE_EVENTS`) while core product remains unaffected.

