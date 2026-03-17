-- Auto-apply runs table
CREATE TABLE IF NOT EXISTS public.auto_apply_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready_for_review', 'confirmed', 'completed', 'failed')),
  config JSONB NOT NULL DEFAULT '{}',
  results JSONB DEFAULT '[]',
  jobs_found INT DEFAULT 0,
  jobs_matched INT DEFAULT 0,
  jobs_applied INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_auto_apply_runs_user ON public.auto_apply_runs (user_id, created_at DESC);
CREATE INDEX idx_auto_apply_runs_status ON public.auto_apply_runs (status);

ALTER TABLE public.auto_apply_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own auto-apply runs"
  ON public.auto_apply_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own auto-apply runs"
  ON public.auto_apply_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto-apply runs"
  ON public.auto_apply_runs FOR UPDATE
  USING (auth.uid() = user_id);
