-- ============================================================
-- Migration: Smart Features (Interview Score, Smart Auto-Apply, Public Profiles, Candidate Graph)
-- ============================================================

-- 1. Smart Auto-Apply Rules
CREATE TABLE IF NOT EXISTS public.smart_apply_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  total_runs INTEGER DEFAULT 0,
  total_applied INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resume_id)
);

ALTER TABLE public.smart_apply_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own smart apply rules"
  ON public.smart_apply_rules FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.smart_apply_rules TO authenticated;

-- 2. Public Profiles
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_visible BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_strength INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_public_slug ON public.users(public_slug) WHERE public_slug IS NOT NULL;

-- Allow anyone to view public profiles
CREATE POLICY "Anyone can view public profiles"
  ON public.users FOR SELECT TO anon
  USING (profile_visible = true AND public_slug IS NOT NULL);

-- 3. Skill Badges (stored per user, computed from structured resume)
CREATE TABLE IF NOT EXISTS public.skill_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('beginner', 'intermediate', 'expert')),
  years_experience NUMERIC(4,1) DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

ALTER TABLE public.skill_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own badges"
  ON public.skill_badges FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view badges"
  ON public.skill_badges FOR SELECT TO anon
  USING (true);

GRANT ALL ON public.skill_badges TO authenticated;
GRANT SELECT ON public.skill_badges TO anon;

-- 4. Candidate Graph (indexed skills for recruiter search)
CREATE TABLE IF NOT EXISTS public.candidate_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  skill_normalized TEXT NOT NULL,
  years_experience NUMERIC(4,1) DEFAULT 0,
  proficiency TEXT DEFAULT 'intermediate' CHECK (proficiency IN ('beginner', 'intermediate', 'expert')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, skill_normalized)
);

ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own skills"
  ON public.candidate_skills FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recruiters can search all candidate skills
CREATE POLICY "Authenticated can view candidate skills"
  ON public.candidate_skills FOR SELECT TO authenticated
  USING (true);

GRANT ALL ON public.candidate_skills TO authenticated;

CREATE INDEX IF NOT EXISTS idx_candidate_skills_normalized ON public.candidate_skills(skill_normalized);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_user ON public.candidate_skills(user_id);

-- 5. Application outcome tracking (for learning loop)
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS interview_date DATE;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS offer_amount NUMERIC(12,2);
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS response_days INTEGER;

-- 6. Update usage_logs CHECK constraint to allow smart_apply
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;
ALTER TABLE public.usage_logs ADD CONSTRAINT usage_logs_feature_check
  CHECK (feature IN (
    'resume_analysis', 'job_match', 'cover_letter', 'interview_prep',
    'resume_improve', 'job_finder', 'auto_apply', 'smart_apply', 'rate_limit'
  ));

-- 7. Resume versions support
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS version_label TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS target_role TEXT;
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
