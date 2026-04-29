-- Marketplace: application timeline events + allow company recruiter members to update applications.
-- Keeps existing recruiter_id-based policies intact; adds company-membership-based access.

-- 1) Application events (timeline / audit log)
CREATE TABLE IF NOT EXISTS public.application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('status_change', 'note_added', 'system')),
  from_stage TEXT NULL,
  to_stage TEXT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_application_events_application_id
  ON public.application_events (application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_events_actor_user_id
  ON public.application_events (actor_user_id, created_at DESC);

ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

-- Read events:
-- - candidate can read events for their applications
-- - any active company member can read events for applications to jobs in their company
CREATE POLICY "application_events_select_by_candidate_or_company_member"
  ON public.application_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_applications ja
      WHERE ja.id = application_events.application_id
        AND ja.candidate_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.job_applications ja
      JOIN public.job_postings jp ON jp.id = ja.job_id
      JOIN public.company_memberships m ON m.company_id = jp.company_id
      WHERE ja.id = application_events.application_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Insert events:
-- only active company members may insert events (recruiter actions).
CREATE POLICY "application_events_insert_by_company_member"
  ON public.application_events FOR INSERT
  WITH CHECK (
    actor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.job_applications ja
      JOIN public.job_postings jp ON jp.id = ja.job_id
      JOIN public.company_memberships m ON m.company_id = jp.company_id
      WHERE ja.id = application_events.application_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );


-- 2) Allow company members to update job applications for jobs in their company.
-- Existing policy only allows recruiter_id to manage; this enables multi-recruiter team workflows.
DROP POLICY IF EXISTS "job_applications_update_by_company_member" ON public.job_applications;
CREATE POLICY "job_applications_update_by_company_member"
  ON public.job_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings jp
      JOIN public.company_memberships m ON m.company_id = jp.company_id
      WHERE jp.id = job_applications.job_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.job_postings jp
      JOIN public.company_memberships m ON m.company_id = jp.company_id
      WHERE jp.id = job_applications.job_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- (Optional but safe) allow company members to SELECT applications for their jobs if not already present.
DROP POLICY IF EXISTS "job_applications_select_by_company_member" ON public.job_applications;
CREATE POLICY "job_applications_select_by_company_member"
  ON public.job_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.job_postings jp
      JOIN public.company_memberships m ON m.company_id = jp.company_id
      WHERE jp.id = job_applications.job_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Grants
GRANT ALL ON public.application_events TO anon, authenticated;

