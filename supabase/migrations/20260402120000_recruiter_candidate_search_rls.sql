-- Allow recruiters to read job_seeker rows and related resumes/preferences for candidate search.
-- Previously only "Users can view own row" applied on public.users, so recruiter queries returned [].
--
-- IMPORTANT: Do not use EXISTS (SELECT … FROM public.users …) inside policies on `users` (or policies
-- that read `users` while evaluating) — PostgreSQL RLS will recurse infinitely. Use the helpers below.

CREATE OR REPLACE FUNCTION public.auth_is_recruiter()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'recruiter'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_job_seeker(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND role = 'job_seeker'
  );
$$;

CREATE OR REPLACE FUNCTION public.resume_belongs_to_job_seeker(p_resume_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.resumes r
    INNER JOIN public.users u ON u.id = r.user_id
    WHERE r.id = p_resume_id AND u.role = 'job_seeker'
  );
$$;

REVOKE ALL ON FUNCTION public.auth_is_recruiter() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_is_job_seeker(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resume_belongs_to_job_seeker(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_is_recruiter() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_job_seeker(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_belongs_to_job_seeker(uuid) TO authenticated;

-- Users: recruiters can read job_seeker profiles
DROP POLICY IF EXISTS "Recruiters can view job seekers for search" ON public.users;
CREATE POLICY "Recruiters can view job seekers for search"
  ON public.users FOR SELECT TO authenticated
  USING (role = 'job_seeker' AND public.auth_is_recruiter());

-- Resumes: recruiters can read resumes owned by job seekers
DROP POLICY IF EXISTS "Recruiters can view job seeker resumes for search" ON public.resumes;
CREATE POLICY "Recruiters can view job seeker resumes for search"
  ON public.resumes FOR SELECT TO authenticated
  USING (
    public.auth_is_recruiter()
    AND public.user_is_job_seeker(resumes.user_id)
  );

-- User preferences: recruiters can read preferences for job seekers
DROP POLICY IF EXISTS "Recruiters can view job seeker preferences for search" ON public.user_preferences;
CREATE POLICY "Recruiters can view job seeker preferences for search"
  ON public.user_preferences FOR SELECT TO authenticated
  USING (
    public.auth_is_recruiter()
    AND public.user_is_job_seeker(user_preferences.user_id)
  );

-- Resume analysis: recruiters can view ATS rows for job seeker resumes (candidate detail page)
DROP POLICY IF EXISTS "Recruiters can view resume analysis for job seekers" ON public.resume_analysis;
CREATE POLICY "Recruiters can view resume analysis for job seekers"
  ON public.resume_analysis FOR SELECT TO authenticated
  USING (
    public.auth_is_recruiter()
    AND public.resume_belongs_to_job_seeker(resume_analysis.resume_id)
  );
