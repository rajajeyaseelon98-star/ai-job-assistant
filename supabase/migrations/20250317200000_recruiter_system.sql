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

-- Job applications (candidates applying to jobs)
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
CREATE INDEX IF NOT EXISTS idx_messages_job_id ON public.messages(job_id);
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

-- Candidate search preferences (saved searches for recruiters)
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters can manage own searches" ON public.saved_searches FOR ALL USING (auth.uid() = recruiter_id);

-- Recruiter usage/plan limits
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_feature_check;
ALTER TABLE public.usage_logs ADD CONSTRAINT usage_logs_feature_check
  CHECK (feature IN ('resume_analysis', 'job_match', 'cover_letter', 'interview_prep', 'resume_improve', 'job_finder', 'job_posting', 'candidate_search', 'ai_screening', 'bulk_message'));

-- Grant permissions on new tables
GRANT ALL ON public.companies TO anon, authenticated;
GRANT ALL ON public.job_postings TO anon, authenticated;
GRANT ALL ON public.job_applications TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;
GRANT ALL ON public.message_templates TO anon, authenticated;
GRANT ALL ON public.saved_searches TO anon, authenticated;
