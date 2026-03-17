-- Add share_token to resume_analysis for public score cards
ALTER TABLE public.resume_analysis ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

CREATE INDEX idx_resume_analysis_share ON public.resume_analysis (share_token) WHERE share_token IS NOT NULL;
