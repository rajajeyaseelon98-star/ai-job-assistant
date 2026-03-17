-- AI Job Assistant - Database Schema
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users; sync via trigger or app logic)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
  name TEXT
);

-- Resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  parsed_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

-- Resume analysis results
CREATE TABLE IF NOT EXISTS public.resume_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  analysis_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_analysis_resume_id ON public.resume_analysis(resume_id);

-- Improved resumes (user_id so paste-only improve is saved; resume_id optional)
CREATE TABLE IF NOT EXISTS public.improved_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  improved_content JSONB NOT NULL,
  job_title TEXT,
  job_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_improved_resumes_resume_id ON public.improved_resumes(resume_id);
CREATE INDEX IF NOT EXISTS idx_improved_resumes_user_id ON public.improved_resumes(user_id);
ALTER TABLE public.improved_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own improved resumes" ON public.improved_resumes
  FOR ALL USING (auth.uid() = user_id);

-- Job matches (user_id so paste-only matches are saved; resume_id optional; resume_text for pre-fill on view)
CREATE TABLE IF NOT EXISTS public.job_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
  job_description TEXT NOT NULL,
  job_title TEXT,
  resume_text TEXT,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  missing_skills JSONB,
  analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_matches_resume_id ON public.job_matches(resume_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_user_id ON public.job_matches(user_id);

-- Usage logs for free plan limits
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('resume_analysis', 'job_match', 'cover_letter', 'interview_prep', 'resume_improve')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_feature ON public.usage_logs(user_id, feature);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON public.usage_logs(timestamp);

-- RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Users: users can read/update their own row; insert on signup
CREATE POLICY "Users can view own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own row" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own row" ON public.users
  FOR DELETE USING (auth.uid() = id);

-- Resumes: full CRUD for own rows
CREATE POLICY "Users can manage own resumes" ON public.resumes
  FOR ALL USING (auth.uid() = user_id);

-- Resume analysis: full access for own resume's analysis
CREATE POLICY "Users can view resume analysis" ON public.resume_analysis
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_analysis.resume_id AND r.user_id = auth.uid())
  );

CREATE POLICY "Users can insert resume analysis" ON public.resume_analysis
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.resumes r WHERE r.id = resume_analysis.resume_id AND r.user_id = auth.uid())
  );

-- Job matches: full access for own rows (by user_id)
CREATE POLICY "Users can manage own job matches" ON public.job_matches
  FOR ALL USING (auth.uid() = user_id);

-- Usage logs: users can only insert and read their own
CREATE POLICY "Users can view own usage" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to create user row on signup (call from app or trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, plan_type)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: after signup in auth.users, create public.users row
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Cover letters (resume_text for pre-fill on view)
CREATE TABLE IF NOT EXISTS public.cover_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT,
  job_title TEXT,
  job_description TEXT,
  content TEXT NOT NULL,
  resume_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON public.cover_letters(user_id);
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cover letters" ON public.cover_letters FOR ALL USING (auth.uid() = user_id);

-- Interview sessions
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  experience_level TEXT,
  content_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own interview sessions" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);

-- User preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  experience_level TEXT,
  preferred_role TEXT,
  preferred_location TEXT,
  salary_expectation TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  razorpay_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Job searches (auto job finder)
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
CREATE POLICY "Users can manage own job searches" ON public.job_searches FOR ALL USING (auth.uid() = user_id);

-- Job applications tracker
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn')),
  applied_date DATE,
  url TEXT,
  salary TEXT,
  location TEXT,
  notes TEXT,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  cover_letter_id UUID REFERENCES public.cover_letters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(user_id, status);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own applications" ON public.applications FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- RECRUITER SYSTEM TABLES
-- =============================================

-- Add role to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'recruiter'));

-- Company profiles for recruiters
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  industry TEXT,
  size TEXT CHECK (size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  location TEXT,
  culture TEXT,
  benefits TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_companies_recruiter_id ON public.companies(recruiter_id);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters can manage own companies" ON public.companies FOR ALL USING (auth.uid() = recruiter_id);
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);

-- Job postings
CREATE TABLE IF NOT EXISTS public.job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  skills_required JSONB DEFAULT '[]',
  experience_min INTEGER DEFAULT 0,
  experience_max INTEGER,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'INR',
  location TEXT,
  work_type TEXT DEFAULT 'onsite' CHECK (work_type IN ('onsite', 'remote', 'hybrid')),
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship')),
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
  application_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter_id ON public.job_postings(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON public.job_postings(created_at);
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters can manage own jobs" ON public.job_postings FOR ALL USING (auth.uid() = recruiter_id);
CREATE POLICY "Anyone can view active jobs" ON public.job_postings FOR SELECT USING (status = 'active');

-- Job applications (candidates applying to recruiter-posted jobs)
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  resume_text TEXT,
  cover_letter TEXT,
  stage TEXT NOT NULL DEFAULT 'applied' CHECK (stage IN ('applied', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_sent', 'hired', 'rejected')),
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  ai_summary TEXT,
  ai_screening JSONB,
  recruiter_notes TEXT,
  recruiter_rating INTEGER CHECK (recruiter_rating >= 1 AND recruiter_rating <= 5),
  interview_date TIMESTAMPTZ,
  interview_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_candidate_id ON public.job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_recruiter_id ON public.job_applications(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_stage ON public.job_applications(stage);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters can manage applications to own jobs" ON public.job_applications FOR ALL USING (auth.uid() = recruiter_id);
CREATE POLICY "Candidates can view own applications" ON public.job_applications FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Candidates can insert applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = candidate_id);

-- Messages between recruiters and candidates
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  template_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own received messages" ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Message templates for recruiters
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  template_type TEXT DEFAULT 'general' CHECK (template_type IN ('general', 'interview_invite', 'rejection', 'offer', 'follow_up')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters can manage own templates" ON public.message_templates FOR ALL USING (auth.uid() = recruiter_id);

-- Saved searches / alerts for recruiters
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters can manage own searches" ON public.saved_searches FOR ALL USING (auth.uid() = recruiter_id);

-- Required: allow anon/authenticated roles to use public schema and tables (fixes "permission denied for schema public")
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
