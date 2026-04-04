-- Recipient role lookup for POST /api/messages must bypass users RLS: job seekers cannot
-- SELECT recruiter rows, so .from("users").eq("id", receiver_id") returned nothing and
-- the API incorrectly returned 404 "Recipient not found". Same pattern as auth_is_recruiter().

CREATE OR REPLACE FUNCTION public.user_role_for_id(p_user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = p_user_id LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.user_role_for_id(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_role_for_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_role_for_id(uuid) TO service_role;
