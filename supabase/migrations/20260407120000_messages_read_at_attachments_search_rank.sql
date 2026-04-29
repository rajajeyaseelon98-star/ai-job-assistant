-- Message read receipts (timestamp), optional attachment metadata, improved recipient search ranking.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attachment_path TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name TEXT,
  ADD COLUMN IF NOT EXISTS attachment_mime TEXT;

COMMENT ON COLUMN public.messages.read_at IS 'Set when the receiver marks the message read (inbound rows).';

CREATE INDEX IF NOT EXISTS idx_messages_attachment_path ON public.messages (attachment_path) WHERE attachment_path IS NOT NULL;

-- Private attachments: users upload under their user id folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  5242880,
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'text/plain'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users upload own message attachments" ON storage.objects;
CREATE POLICY "Users upload own message attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users read message attachments they participate in" ON storage.objects;
CREATE POLICY "Users read message attachments they participate in"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.attachment_path = name
          AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users delete own message attachment uploads" ON storage.objects;
CREATE POLICY "Users delete own message attachment uploads"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Smarter ranking: exact email > prefix email > prefix name > contains; recent contacts first within tier.
-- Preserves ILIKE wildcard escaping from 20260404110000_messaging_search_hardening.sql.
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
  ORDER BY
    CASE
      WHEN lower(btrim(u.email)) = lower(btrim(q_raw)) THEN 0
      WHEN u.email ILIKE q_esc || '%' ESCAPE '\' THEN 1
      WHEN COALESCE(btrim(u.name), '') <> '' AND u.name ILIKE q_esc || '%' ESCAPE '\' THEN 2
      ELSE 3
    END ASC,
    (
      SELECT MAX(m.created_at)
      FROM public.messages m
      WHERE (m.sender_id = u.id AND m.receiver_id = auth.uid())
         OR (m.receiver_id = u.id AND m.sender_id = auth.uid())
    ) DESC NULLS LAST,
    u.email ASC
  LIMIT lim;
END;
$$;

REVOKE ALL ON FUNCTION public.search_message_recipients(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_message_recipients(text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_message_recipients(text, int) TO service_role;
