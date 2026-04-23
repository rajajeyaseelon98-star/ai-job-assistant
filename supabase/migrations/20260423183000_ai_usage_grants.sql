-- Fix ai_usage permission errors for authenticated users.
-- RLS policies already scope rows to auth.uid(); this migration adds missing table/sequence grants.

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, INSERT ON TABLE public.ai_usage TO authenticated;
GRANT SELECT ON TABLE public.ai_usage TO anon;

-- UUID default uses uuid_generate_v4(), so no serial sequence grant required.
-- Keep writes restricted by RLS:
--   SELECT policy: auth.uid() = user_id
--   INSERT policy: auth.uid() = user_id

