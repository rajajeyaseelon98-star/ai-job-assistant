-- Phase 1.5 (hardening): Share recruiter templates + alerts across company teams
-- Adds company_id to message_templates + saved_searches and enables membership-based access.

-- 1) Columns
ALTER TABLE public.message_templates
  ADD COLUMN IF NOT EXISTS company_id uuid NULL REFERENCES public.companies(id) ON DELETE CASCADE;

ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS company_id uuid NULL REFERENCES public.companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_message_templates_company_id ON public.message_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_company_id ON public.saved_searches(company_id);

-- 2) Backfill company_id where possible, using current recruiter memberships.
UPDATE public.message_templates t
SET company_id = m.company_id
FROM public.company_memberships m
WHERE t.company_id IS NULL
  AND m.user_id = t.recruiter_id
  AND m.status = 'active';

UPDATE public.saved_searches s
SET company_id = m.company_id
FROM public.company_memberships m
WHERE s.company_id IS NULL
  AND m.user_id = s.recruiter_id
  AND m.status = 'active';

-- 3) RLS policies (additive)
-- Allow company members to read shared resources.
DROP POLICY IF EXISTS "message_templates_read_by_company_membership" ON public.message_templates;
CREATE POLICY "message_templates_read_by_company_membership"
  ON public.message_templates FOR SELECT
  USING (
    company_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = message_templates.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "saved_searches_read_by_company_membership" ON public.saved_searches;
CREATE POLICY "saved_searches_read_by_company_membership"
  ON public.saved_searches FOR SELECT
  USING (
    company_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = saved_searches.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Allow owner/admin to manage (insert/update/delete) shared resources.
DROP POLICY IF EXISTS "message_templates_manage_by_company_admin" ON public.message_templates;
CREATE POLICY "message_templates_manage_by_company_admin"
  ON public.message_templates FOR ALL
  USING (
    company_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = message_templates.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    company_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = message_templates.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
    AND auth.uid() = recruiter_id
  );

DROP POLICY IF EXISTS "saved_searches_manage_by_company_admin" ON public.saved_searches;
CREATE POLICY "saved_searches_manage_by_company_admin"
  ON public.saved_searches FOR ALL
  USING (
    company_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = saved_searches.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    company_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = saved_searches.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
    AND auth.uid() = recruiter_id
  );

