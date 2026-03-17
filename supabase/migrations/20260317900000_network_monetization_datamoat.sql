-- ============================================================
-- Phase 5: Network Effect + Monetization + Data Moat
-- ============================================================

-- 1. Activity Feed (Network Effect)
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'application_submitted', 'interview_scheduled', 'offer_received',
    'resume_improved', 'skill_added', 'profile_updated', 'milestone',
    'auto_apply_completed', 'score_improved'
  )),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX idx_activity_feed_public ON activity_feed(is_public, created_at DESC) WHERE is_public = true;

-- RLS for activity_feed
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own activities" ON activity_feed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public activities visible to all" ON activity_feed FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own activities" ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Social Proof / Platform Stats (cached aggregates)
CREATE TABLE IF NOT EXISTS platform_stats (
  id TEXT PRIMARY KEY DEFAULT 'global',
  total_users INTEGER DEFAULT 0,
  total_applications INTEGER DEFAULT 0,
  total_interviews INTEGER DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  total_resumes_improved INTEGER DEFAULT 0,
  avg_match_score NUMERIC(5,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial row
INSERT INTO platform_stats (id) VALUES ('global') ON CONFLICT DO NOTHING;

-- RLS: anyone can read, only service role updates
ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read platform stats" ON platform_stats FOR SELECT USING (true);

-- 3. Candidate Boost (Monetization)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS boost_multiplier NUMERIC(3,1) DEFAULT 1.0;

-- 4. Recruiter Push Notifications (recruiter → candidate)
CREATE TABLE IF NOT EXISTS recruiter_pushes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID,
  push_type TEXT NOT NULL CHECK (push_type IN ('job_invite', 'interview_request', 'profile_view', 'shortlisted')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_recruiter_pushes_candidate ON recruiter_pushes(candidate_id, created_at DESC);
CREATE INDEX idx_recruiter_pushes_recruiter ON recruiter_pushes(recruiter_id, created_at DESC);

ALTER TABLE recruiter_pushes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates can read own pushes" ON recruiter_pushes FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Recruiters can insert pushes" ON recruiter_pushes FOR INSERT WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "Recruiters can read own pushes" ON recruiter_pushes FOR SELECT USING (auth.uid() = recruiter_id);

-- 5. Hiring Success Model (Data Moat)
CREATE TABLE IF NOT EXISTS hiring_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID,
  candidate_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recruiter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  match_score NUMERIC(5,2),
  interview_score NUMERIC(5,2),
  was_hired BOOLEAN DEFAULT false,
  days_to_hire INTEGER,
  skills_matched TEXT[],
  skills_missing TEXT[],
  job_title TEXT,
  job_location TEXT,
  salary_offered NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hiring_outcomes_job ON hiring_outcomes(job_title);
CREATE INDEX idx_hiring_outcomes_hired ON hiring_outcomes(was_hired);

ALTER TABLE hiring_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters can read own outcomes" ON hiring_outcomes FOR SELECT USING (auth.uid() = recruiter_id);
CREATE POLICY "Candidates can read own outcomes" ON hiring_outcomes FOR SELECT USING (auth.uid() = candidate_id);

-- 6. Salary Intelligence (Data Moat)
CREATE TABLE IF NOT EXISTS salary_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  normalized_title TEXT NOT NULL,
  location TEXT,
  experience_years INTEGER,
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  salary_avg NUMERIC(12,2),
  currency TEXT DEFAULT 'INR',
  source TEXT DEFAULT 'platform', -- platform, user_reported, job_posting
  data_points INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_salary_data_title ON salary_data(normalized_title);
CREATE INDEX idx_salary_data_location ON salary_data(location);

ALTER TABLE salary_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read salary data" ON salary_data FOR SELECT USING (true);

-- 7. Skill Demand Graph (Data Moat)
CREATE TABLE IF NOT EXISTS skill_demand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name TEXT NOT NULL,
  normalized_skill TEXT NOT NULL,
  demand_count INTEGER DEFAULT 0,
  supply_count INTEGER DEFAULT 0,
  demand_trend NUMERIC(5,2) DEFAULT 0, -- % change month over month
  avg_salary NUMERIC(12,2),
  top_roles TEXT[],
  month TEXT NOT NULL, -- '2026-03'
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(normalized_skill, month)
);

CREATE INDEX idx_skill_demand_skill ON skill_demand(normalized_skill);
CREATE INDEX idx_skill_demand_month ON skill_demand(month);

ALTER TABLE skill_demand ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read skill demand" ON skill_demand FOR SELECT USING (true);

-- 8. Candidate Rankings (for "Top Candidates" feature)
ALTER TABLE users ADD COLUMN IF NOT EXISTS candidate_rank_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();
