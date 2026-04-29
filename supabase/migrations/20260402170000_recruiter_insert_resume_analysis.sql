-- Allow recruiters to insert ATS rows for job-seeker resumes (recruiter-triggered analysis from UI).
-- Uses same helpers as SELECT policies (no recursion on users).

CREATE POLICY "Recruiters can insert resume analysis for job seekers"
  ON public.resume_analysis FOR INSERT TO authenticated
  WITH CHECK (
    public.auth_is_recruiter()
    AND public.resume_belongs_to_job_seeker(resume_id)
  );
