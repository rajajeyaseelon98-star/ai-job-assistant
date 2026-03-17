-- AI response cache for cost reduction
CREATE TABLE IF NOT EXISTS public.ai_cache (
  hash TEXT PRIMARY KEY,
  response JSONB NOT NULL,
  feature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_ai_cache_feature ON public.ai_cache (feature);
CREATE INDEX idx_ai_cache_expires ON public.ai_cache (expires_at);

-- RLS with policies for authenticated server access
ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write cache (server-side routes use authenticated role)
CREATE POLICY "Authenticated can read cache"
  ON public.ai_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert cache"
  ON public.ai_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update cache"
  ON public.ai_cache FOR UPDATE
  TO authenticated
  USING (true);

-- Cleanup function for expired entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_ai_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.ai_cache WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_ai_cache() TO authenticated;
