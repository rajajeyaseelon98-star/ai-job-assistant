-- ============================================================
-- Phase 7A: User Addiction Loop
-- Streak system, daily actions, opportunity alerts
-- ============================================================

-- 1. User Streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  total_active_days INTEGER DEFAULT 0,
  streak_multiplier NUMERIC(3,2) DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX idx_user_streaks_current ON user_streaks(current_streak DESC);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own streak" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Daily Actions (personalized to-do items)
CREATE TABLE IF NOT EXISTS daily_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'apply_jobs', 'improve_resume', 'check_matches', 'prep_interview',
    'update_skills', 'review_analytics', 'tailor_resume', 'explore_salary',
    'boost_profile', 'respond_recruiter', 'check_competition'
  )),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=urgent
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, action_date, action_type)
);

CREATE INDEX idx_daily_actions_user_date ON daily_actions(user_id, action_date DESC);
CREATE INDEX idx_daily_actions_incomplete ON daily_actions(user_id, action_date, completed) WHERE completed = false;

ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own actions" ON daily_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own actions" ON daily_actions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own actions" ON daily_actions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Opportunity Alerts (high-chance jobs, time-sensitive)
CREATE TABLE IF NOT EXISTS opportunity_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'high_match_job', 'trending_role', 'recruiter_interest',
    'salary_spike', 'low_competition', 'deadline_approaching',
    'new_skill_demand'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  seen BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_opportunity_alerts_user ON opportunity_alerts(user_id, created_at DESC);
CREATE INDEX idx_opportunity_alerts_active ON opportunity_alerts(user_id, dismissed, expires_at)
  WHERE dismissed = false;

ALTER TABLE opportunity_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own alerts" ON opportunity_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON opportunity_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON opportunity_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Streak rewards tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_freeze_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_points INTEGER DEFAULT 0;
