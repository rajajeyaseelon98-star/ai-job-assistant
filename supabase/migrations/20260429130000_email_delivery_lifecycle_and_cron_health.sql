-- Email lifecycle tracking (provider webhooks) + cron health table.

ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NULL
    CHECK (delivery_status IN ('delivered','bounced','complaint','unknown')),
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS webhook_last_event TEXT NULL,
  ADD COLUMN IF NOT EXISTS webhook_last_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_provider_message_id ON public.email_logs(provider_message_id);

CREATE TABLE IF NOT EXISTS public.email_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  ok BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ NULL,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_email_job_runs_job_name ON public.email_job_runs(job_name, started_at DESC);

ALTER TABLE public.email_job_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_job_runs_select_none" ON public.email_job_runs;
CREATE POLICY "email_job_runs_select_none"
  ON public.email_job_runs FOR SELECT
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "email_job_runs_insert_none" ON public.email_job_runs;
CREATE POLICY "email_job_runs_insert_none"
  ON public.email_job_runs FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "email_job_runs_update_none" ON public.email_job_runs;
CREATE POLICY "email_job_runs_update_none"
  ON public.email_job_runs FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

GRANT ALL ON public.email_job_runs TO anon, authenticated;

