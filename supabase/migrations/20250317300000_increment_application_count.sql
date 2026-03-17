-- Atomic increment function for application_count on job_postings
CREATE OR REPLACE FUNCTION public.increment_application_count(posting_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.job_postings
  SET application_count = COALESCE(application_count, 0) + 1
  WHERE id = posting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.increment_application_count(UUID) TO anon, authenticated;
