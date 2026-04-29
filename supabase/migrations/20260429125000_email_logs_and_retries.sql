-- Email reliability hardening: audit trail + retry metadata + idempotency support.

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'all' CHECK (category IN ('all', 'invites', 'marketplace')),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'skipped', 'failed')),
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT NULL,
  error TEXT NULL,
  error_code TEXT NULL,
  retryable BOOLEAN NOT NULL DEFAULT false,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  next_retry_at TIMESTAMPTZ NULL,
  idempotency_key TEXT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status_next_retry ON public.email_logs(status, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_event_type ON public.email_logs(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_idempotency_key ON public.email_logs(idempotency_key);

-- Prevent duplicate successful sends when idempotency key is provided.
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_logs_idempotency_sent
  ON public.email_logs(idempotency_key)
  WHERE idempotency_key IS NOT NULL AND status IN ('queued', 'sent');

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- No user-facing read/write policies: internal server/service-role only.
DROP POLICY IF EXISTS "email_logs_select_none" ON public.email_logs;
CREATE POLICY "email_logs_select_none"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "email_logs_insert_none" ON public.email_logs;
CREATE POLICY "email_logs_insert_none"
  ON public.email_logs FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "email_logs_update_none" ON public.email_logs;
CREATE POLICY "email_logs_update_none"
  ON public.email_logs FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

GRANT ALL ON public.email_logs TO anon, authenticated;
