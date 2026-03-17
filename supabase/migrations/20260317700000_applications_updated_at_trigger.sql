-- Auto-set updated_at on applications table when rows are modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to applications table
DROP TRIGGER IF EXISTS set_applications_updated_at ON public.applications;
CREATE TRIGGER set_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to auto_apply_runs table as well
DROP TRIGGER IF EXISTS set_auto_apply_runs_updated_at ON public.auto_apply_runs;
CREATE TRIGGER set_auto_apply_runs_updated_at
  BEFORE UPDATE ON public.auto_apply_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to job_postings table
DROP TRIGGER IF EXISTS set_job_postings_updated_at ON public.job_postings;
CREATE TRIGGER set_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to job_applications table
DROP TRIGGER IF EXISTS set_job_applications_updated_at ON public.job_applications;
CREATE TRIGGER set_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to companies table
DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
