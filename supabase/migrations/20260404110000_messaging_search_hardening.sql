-- 1) Escape ILIKE wildcards in search_message_recipients (% and _ cannot broaden matches).
-- 2) pg_trgm indexes for substring search on users.email / users.name.
-- 3) usage_logs feature message_recipient_search + cleanup alongside rate_limit.

CREATE OR REPLACE FUNCTION public.search_message_recipients(p_query text, p_limit int DEFAULT 15)
RETURNS TABLE (id uuid, name text, email text, role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me_role text;
  q_raw text;
  q_esc text;
  lim int;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  SELECT u.role INTO me_role FROM public.users u WHERE u.id = auth.uid();
  IF me_role IS NULL THEN RETURN; END IF;

  q_raw := trim(p_query);
  IF q_raw IS NULL OR length(q_raw) < 2 THEN RETURN; END IF;

  -- Escape \ % _ for ILIKE ... ESCAPE '\'
  q_esc := replace(replace(replace(q_raw, E'\\', E'\\\\'), '%', E'\%'), '_', E'\_');

  lim := LEAST(COALESCE(p_limit, 15), 25);

  RETURN QUERY
  SELECT u.id, u.name, u.email, u.role::text
  FROM public.users u
  WHERE (
    u.email ILIKE '%' || q_esc || '%' ESCAPE '\'
    OR COALESCE(u.name, '') ILIKE '%' || q_esc || '%' ESCAPE '\'
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

-- Trigram indexes (Supabase: enable pg_trgm in Dashboard if CREATE EXTENSION fails.)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_users_message_search_email_trgm
  ON public.users USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_message_search_name_trgm
  ON public.users USING gin ((COALESCE(name, ''::text)) gin_trgm_ops);

-- Allow rate-limit rows for recipient search API
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;
ALTER TABLE public.usage_logs ADD CONSTRAINT usage_logs_feature_check
  CHECK (feature IN (
    'resume_analysis', 'job_match', 'cover_letter', 'interview_prep',
    'resume_improve', 'job_finder', 'auto_apply', 'smart_apply', 'rate_limit',
    'message_recipient_search'
  ));

CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.usage_logs
  WHERE feature IN ('rate_limit', 'message_recipient_search')
    AND timestamp < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
