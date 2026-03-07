-- Store resume text so "View" from history can pre-fill the forms.

ALTER TABLE public.job_matches ADD COLUMN IF NOT EXISTS resume_text TEXT;
ALTER TABLE public.cover_letters ADD COLUMN IF NOT EXISTS resume_text TEXT;
