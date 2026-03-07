-- Job matches: add user_id so we can save matches without a resume (paste-only flow).
-- RLS will use user_id; resume_id becomes optional.

ALTER TABLE public.job_matches ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
UPDATE public.job_matches SET user_id = (SELECT user_id FROM public.resumes WHERE id = job_matches.resume_id) WHERE user_id IS NULL AND resume_id IS NOT NULL;
ALTER TABLE public.job_matches ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.job_matches ALTER COLUMN resume_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_matches_user_id ON public.job_matches(user_id);

DROP POLICY IF EXISTS "Users can manage own job matches" ON public.job_matches;
CREATE POLICY "Users can manage own job matches" ON public.job_matches
  FOR ALL USING (auth.uid() = user_id);
