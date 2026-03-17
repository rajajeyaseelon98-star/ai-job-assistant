-- Job searches: stores auto-found job results for users
CREATE TABLE IF NOT EXISTS public.job_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_text TEXT,
  extracted_skills JSONB,
  job_results JSONB NOT NULL DEFAULT '[]',
  search_query TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_searches_user_id ON public.job_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_job_searches_created_at ON public.job_searches(created_at);

ALTER TABLE public.job_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own job searches" ON public.job_searches
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.job_searches TO anon, authenticated;

-- Update usage_logs feature check constraint to include job_finder
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;
ALTER TABLE public.usage_logs ADD CONSTRAINT usage_logs_feature_check
  CHECK (feature IN ('resume_analysis', 'job_match', 'cover_letter', 'interview_prep', 'resume_improve', 'job_finder'));
