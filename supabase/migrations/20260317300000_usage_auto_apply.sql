-- Update usage_logs check constraint to include auto_apply
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;
ALTER TABLE public.usage_logs ADD CONSTRAINT usage_logs_feature_check
  CHECK (feature IN ('resume_analysis', 'job_match', 'cover_letter', 'interview_prep', 'resume_improve', 'job_finder', 'auto_apply'));
