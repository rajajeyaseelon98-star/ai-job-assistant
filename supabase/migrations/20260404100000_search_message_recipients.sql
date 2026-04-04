-- Name/email search for messaging "To" field. RLS prevents cross-role user listing; use SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.search_message_recipients(p_query text, p_limit int DEFAULT 15)
RETURNS TABLE (id uuid, name text, email text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me_role text;
  q text;
  lim int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  SELECT u.role INTO me_role FROM public.users u WHERE u.id = auth.uid();
  IF me_role IS NULL THEN RETURN; END IF;

  q := trim(p_query);
  IF q IS NULL OR length(q) < 2 THEN RETURN; END IF;

  lim := LEAST(COALESCE(p_limit, 15), 25);

  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role::text
  FROM public.users u
  WHERE (
    u.email ILIKE '%' || q || '%'
    OR COALESCE(u.name, '') ILIKE '%' || q || '%'
  )
  AND (
    (me_role = 'recruiter' AND u.role = 'job_seeker')
    OR (me_role = 'job_seeker' AND u.role = 'recruiter')
  )
  AND u.id <> auth.uid()
  ORDER BY u.email
  LIMIT lim;
END;
$$;

REVOKE ALL ON FUNCTION public.search_message_recipients(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_message_recipients(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_message_recipients(text, int) TO service_role;
