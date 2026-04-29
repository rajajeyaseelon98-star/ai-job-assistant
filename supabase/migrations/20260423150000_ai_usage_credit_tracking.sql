-- AI usage tracking + credit balance columns

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS total_credits INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS used_credits INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_total_credits_non_negative,
  DROP CONSTRAINT IF EXISTS users_used_credits_non_negative;

ALTER TABLE public.users
  ADD CONSTRAINT users_total_credits_non_negative CHECK (total_credits >= 0),
  ADD CONSTRAINT users_used_credits_non_negative CHECK (used_credits >= 0);

CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  feature_name TEXT NOT NULL,
  provider TEXT,
  model_used TEXT,
  prompt_tokens INTEGER NOT NULL DEFAULT 0 CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER NOT NULL DEFAULT 0 CHECK (completion_tokens >= 0),
  total_tokens INTEGER NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  credits_used NUMERIC(12, 3) NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12, 6),
  cost_inr NUMERIC(12, 4),
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created_at
  ON public.ai_usage (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_feature_created_at
  ON public.ai_usage (user_id, feature_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_feature_created_at
  ON public.ai_usage (feature_name, created_at DESC);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai usage" ON public.ai_usage;
CREATE POLICY "Users can view own ai usage" ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own ai usage" ON public.ai_usage;
CREATE POLICY "Users can insert own ai usage" ON public.ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
