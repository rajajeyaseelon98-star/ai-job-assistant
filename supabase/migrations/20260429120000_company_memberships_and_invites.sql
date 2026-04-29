-- Marketplace foundation: company multi-user memberships + invite workflow.
-- This migration is additive and keeps existing recruiter_id-based flows working.

-- 1) Company memberships (multi-user under a company)
CREATE TABLE IF NOT EXISTS public.company_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'recruiter')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active')),
  invited_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_memberships_company_id ON public.company_memberships(company_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_user_id ON public.company_memberships(user_id);

ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

-- Read: any member can view membership rows for their companies.
CREATE POLICY "company_memberships_read_by_members"
  ON public.company_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = company_memberships.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Insert: allow a user to insert their own membership only (used for initial owner bootstrap).
CREATE POLICY "company_memberships_self_insert"
  ON public.company_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update/Delete: only owner/admin members can manage memberships in their company.
CREATE POLICY "company_memberships_manage_by_admin"
  ON public.company_memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = company_memberships.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "company_memberships_delete_by_admin"
  ON public.company_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = company_memberships.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );


-- 2) Company invites (email invites, token-based acceptance)
CREATE TABLE IF NOT EXISTS public.company_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'recruiter')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_invites_company_id ON public.company_invites(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invites_email ON public.company_invites(email);

ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

-- Read: active members can view invites for their company.
CREATE POLICY "company_invites_read_by_members"
  ON public.company_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = company_invites.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Insert: owner/admin can create invites.
CREATE POLICY "company_invites_insert_by_admin"
  ON public.company_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = company_invites.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
    AND auth.uid() = invited_by
  );

-- Update: owner/admin can mark invites accepted/expired (server route will drive).
CREATE POLICY "company_invites_update_by_admin"
  ON public.company_invites FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = company_invites.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );


-- 3) Backfill memberships for existing recruiter-owned companies.
-- Existing schema uses public.companies.recruiter_id referencing public.users(id).
-- We create an owner membership for that recruiter user (if exists).
INSERT INTO public.company_memberships (company_id, user_id, role, status, invited_by)
SELECT c.id, c.recruiter_id, 'owner', 'active', NULL
FROM public.companies c
WHERE c.recruiter_id IS NOT NULL
ON CONFLICT (company_id, user_id) DO NOTHING;


-- 4) Add membership-based policies on existing tables (keeps existing policies intact).
-- Companies: members can view; admins can update.
-- NOTE: We intentionally do NOT add a broader companies SELECT policy here.
-- Existing schema already allows public company viewing via:
--   CREATE POLICY "Anyone can view companies" ... FOR SELECT USING (true);
-- Membership-based read constraints can be tightened later if you want private companies.

DROP POLICY IF EXISTS "companies_update_by_admin_membership" ON public.companies;
CREATE POLICY "companies_update_by_admin_membership"
  ON public.companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = companies.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    )
  );

-- Job postings: members can manage jobs for their company.
DROP POLICY IF EXISTS "job_postings_manage_by_company_membership" ON public.job_postings;
CREATE POLICY "job_postings_manage_by_company_membership"
  ON public.job_postings FOR ALL
  USING (
    company_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.company_memberships m
      WHERE m.company_id = job_postings.company_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Job applications: members can view/manage applications for their company jobs.
-- This is additive; existing recruiter_id policy still applies.
DROP POLICY IF EXISTS "job_applications_manage_by_company_membership" ON public.job_applications;
CREATE POLICY "job_applications_manage_by_company_membership"
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
GRANT ALL ON public.company_memberships TO anon, authenticated;
GRANT ALL ON public.company_invites TO anon, authenticated;

