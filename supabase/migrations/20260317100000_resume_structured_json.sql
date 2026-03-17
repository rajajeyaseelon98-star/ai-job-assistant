-- Add structured JSON column to resumes for parsed resume data
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS structured_json JSONB;

CREATE INDEX idx_resumes_structured ON public.resumes (id) WHERE structured_json IS NOT NULL;
