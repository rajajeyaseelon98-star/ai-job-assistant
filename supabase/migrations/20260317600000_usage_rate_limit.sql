-- Update usage_logs check constraint to include rate_limit for DB-backed rate limiting
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;
ALTER TABLE public.usage_logs ADD CONSTRAINT usage_logs_feature_check
  CHECK (feature IN ('resume_analysis', 'job_match', 'cover_letter', 'interview_prep', 'resume_improve', 'job_finder', 'auto_apply', 'rate_limit'));

-- Index for fast rate limit lookups (recent entries by user + feature)
CREATE INDEX IF NOT EXISTS idx_usage_logs_rate_limit
  ON public.usage_logs (user_id, feature, timestamp DESC)
  WHERE feature = 'rate_limit';

-- Cleanup function: delete rate_limit entries older than 5 minutes (they serve no purpose)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM public.usage_logs
  WHERE feature = 'rate_limit'
    AND timestamp < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
