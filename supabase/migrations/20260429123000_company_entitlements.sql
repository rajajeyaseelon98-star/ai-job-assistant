-- Phase 5: Company entitlements / plan limits (pricing + enforcement foundation)

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan_tier text NOT NULL DEFAULT 'starter'
    CHECK (plan_tier IN ('starter', 'pro', 'enterprise')),
  ADD COLUMN IF NOT EXISTS max_active_jobs integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS max_team_members integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Keep updated_at fresh when entitlements are changed
CREATE OR REPLACE FUNCTION public.touch_company_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_touch_updated_at ON public.companies;
CREATE TRIGGER trg_companies_touch_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.touch_company_updated_at();

