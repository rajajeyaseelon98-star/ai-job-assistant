-- Run this in Supabase SQL Editor if you get "permission denied for schema public"
-- This grants the anon and authenticated roles access to public schema and tables.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.resumes TO anon, authenticated;
GRANT ALL ON public.resume_analysis TO anon, authenticated;
GRANT ALL ON public.improved_resumes TO anon, authenticated;
GRANT ALL ON public.job_matches TO anon, authenticated;
GRANT ALL ON public.usage_logs TO anon, authenticated;

-- If you already ran the full schema with new tables:
GRANT ALL ON public.cover_letters TO anon, authenticated;
GRANT ALL ON public.interview_sessions TO anon, authenticated;
GRANT ALL ON public.user_preferences TO anon, authenticated;
GRANT ALL ON public.subscriptions TO anon, authenticated;

-- Sequences (for default UUIDs / serials)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
