-- Improved resumes: add user_id so we can save when user only pasted (no upload). History then shows all.
ALTER TABLE public.improved_resumes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE;
UPDATE public.improved_resumes SET user_id = (SELECT r.user_id FROM public.resumes r WHERE r.id = improved_resumes.resume_id) WHERE user_id IS NULL AND resume_id IS NOT NULL;
ALTER TABLE public.improved_resumes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.improved_resumes ALTER COLUMN resume_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_improved_resumes_user_id ON public.improved_resumes(user_id);

DROP POLICY IF EXISTS "Users can manage own improved resumes" ON public.improved_resumes;
CREATE POLICY "Users can manage own improved resumes" ON public.improved_resumes
  FOR ALL USING (auth.uid() = user_id);
