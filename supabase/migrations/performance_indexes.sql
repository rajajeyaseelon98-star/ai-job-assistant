-- Performance indexes for AI Job Assistant
-- Safely skips indexes for tables that don't exist yet.

DO $$
DECLARE
  _tbl text;
BEGIN

  -- resume_analysis
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'resume_analysis';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_resume_analysis_resume_created ON resume_analysis(resume_id, created_at DESC)';
  END IF;

  -- job_matches
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_matches';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_job_matches_user_created ON job_matches(user_id, created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_job_matches_user_score ON job_matches(user_id, match_score)';
  END IF;

  -- cover_letters
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cover_letters';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cover_letters_user_created ON cover_letters(user_id, created_at DESC)';
  END IF;

  -- applications
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'applications';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status)';
  END IF;

  -- auto_apply_runs
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auto_apply_runs';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_auto_apply_runs_user_created ON auto_apply_runs(user_id, created_at DESC)';
  END IF;

  -- opportunity_alerts
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'opportunity_alerts';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_opportunity_alerts_user_dismissed ON opportunity_alerts(user_id, dismissed, created_at DESC)';
  END IF;

  -- usage_logs (no created_at column — index on the two filter columns only)
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usage_logs';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_usage_logs_user_feature ON usage_logs(user_id, feature)';
  END IF;

  -- recruiter_pushes
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'recruiter_pushes';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_recruiter_pushes_candidate_read ON recruiter_pushes(candidate_id, read, created_at DESC)';
  END IF;

  -- user_streaks
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_streaks';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id)';
  END IF;

  -- ai_cache
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_cache';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_cache(hash)';
  END IF;

  -- notifications
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC)';
  END IF;

  -- daily_actions
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_actions';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_daily_actions_user_date ON daily_actions(user_id, action_date)';
  END IF;

  -- improved_resumes
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'improved_resumes';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_improved_resumes_user_created ON improved_resumes(user_id, created_at DESC)';
  END IF;

  -- candidate_skills
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'candidate_skills';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_candidate_skills_user ON candidate_skills(user_id)';
  END IF;

  -- activity_feed
  SELECT INTO _tbl tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activity_feed';
  IF _tbl IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_activity_feed_user_created ON activity_feed(user_id, created_at DESC)';
  END IF;

  RAISE NOTICE 'Performance indexes applied (skipped tables that do not exist).';
END $$;
