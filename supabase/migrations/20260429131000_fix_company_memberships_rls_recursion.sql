-- Fix: "infinite recursion detected in policy for relation company_memberships" (42P17).
-- Root cause: RLS policy on company_memberships referenced company_memberships again via EXISTS.
-- Approach: use SECURITY DEFINER helpers (bypass RLS) and rewrite policies to call them.

CREATE OR REPLACE FUNCTION public.is_active_company_member(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships m
    WHERE m.company_id = p_company_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_company_admin(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships m
    WHERE m.company_id = p_company_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_company_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_company_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_company_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_company_admin(uuid) TO authenticated;

-- Recreate policies without self-referential subqueries.
DROP POLICY IF EXISTS "company_memberships_read_by_members" ON public.company_memberships;
CREATE POLICY "company_memberships_read_by_members"
  ON public.company_memberships FOR SELECT
  USING (public.is_active_company_member(company_id));

DROP POLICY IF EXISTS "company_memberships_manage_by_admin" ON public.company_memberships;
CREATE POLICY "company_memberships_manage_by_admin"
  ON public.company_memberships FOR UPDATE
  USING (public.is_active_company_admin(company_id));

DROP POLICY IF EXISTS "company_memberships_delete_by_admin" ON public.company_memberships;
CREATE POLICY "company_memberships_delete_by_admin"
  ON public.company_memberships FOR DELETE
  USING (public.is_active_company_admin(company_id));

