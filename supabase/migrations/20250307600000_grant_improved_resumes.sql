-- Ensure anon and authenticated can access improved_resumes (fixes "permission denied" when migrations ran without grants.sql).
GRANT ALL ON public.improved_resumes TO anon, authenticated;
