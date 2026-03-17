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
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own applications" ON public.applications
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.applications TO anon, authenticated;
