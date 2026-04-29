-- Public avatars bucket + RLS; RPC for safe peer display in messaging UI.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users insert own avatar" ON storage.objects;
CREATE POLICY "Users insert own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- id, name, avatar_url for users who have at least one message thread with auth.uid()
CREATE OR REPLACE FUNCTION public.messaging_peer_profiles(p_peer_ids uuid[])
RETURNS TABLE (id uuid, name text, avatar_url text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u.id, u.name, u.avatar_url
  FROM public.users u
  WHERE u.id = ANY(p_peer_ids)
    AND EXISTS (
      SELECT 1
      FROM public.messages m
      WHERE (m.sender_id = auth.uid() AND m.receiver_id = u.id)
         OR (m.receiver_id = auth.uid() AND m.sender_id = u.id)
    );
$$;

REVOKE ALL ON FUNCTION public.messaging_peer_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.messaging_peer_profiles(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messaging_peer_profiles(uuid[]) TO service_role;
