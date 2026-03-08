-- Improved resumes: store AI-rewritten resume content for history and download.
CREATE TABLE IF NOT EXISTS public.improved_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  improved_content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_improved_resumes_resume_id ON public.improved_resumes(resume_id);
ALTER TABLE public.improved_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own improved resumes" ON public.improved_resumes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = improved_resumes.resume_id AND r.user_id = auth.uid())
  );

-- Allow resume_improve in usage_logs feature check (for Pro usage tracking / free = 0 limit).
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;
ALTER TABLE public.usage_logs ADD CONSTRAINT usage_logs_feature_check
  CHECK (feature IN ('resume_analysis', 'job_match', 'cover_letter', 'interview_prep', 'resume_improve'));
