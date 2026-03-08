-- Store job context for job-specific improved resumes (for history display).
ALTER TABLE public.improved_resumes ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.improved_resumes ADD COLUMN IF NOT EXISTS job_description TEXT;
