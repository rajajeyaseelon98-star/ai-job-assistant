import { createClient } from "@/lib/supabase/server";

export interface AiUsageSummary {
  totalTokens: number;
  totalCredits: number;
  totalCostUsd: number;
  totalCostInr: number;
  mostUsedFeature: string | null;
  totalCreditsAvailable: number;
  usedCredits: number;
  remainingCredits: number;
}

export interface AiUsageHistoryRow {
  id: string;
  feature_name: string;
  total_tokens: number;
  credits_used: number;
  cost_usd: number | null;
  cost_inr: number | null;
  cache_hit: boolean;
  model_used: string | null;
  provider: string | null;
  created_at: string;
}

export interface AiFeatureBreakdownRow {
  feature_name: string;
  calls: number;
  total_tokens: number;
  total_credits: number;
  total_cost_usd: number;
  total_cost_inr: number;
}

export async function getAiUsageSummary(userId: string): Promise<AiUsageSummary> {
  const supabase = await createClient();
  const { data: usageRows, error: usageError } = await supabase
    .from("ai_usage")
    .select("feature_name,total_tokens,credits_used,cost_usd,cost_inr")
    .eq("user_id", userId);
  if (usageError) {
    throw new Error(`Failed to query ai_usage summary: ${usageError.message}`);
  }
  const { data: userCredits, error: userCreditsError } = await supabase
    .from("users")
    .select("total_credits,used_credits")
    .eq("id", userId)
    .single();
  if (userCreditsError) {
    throw new Error(`Failed to query users credit balance: ${userCreditsError.message}`);
  }

  const rows = usageRows || [];
  const byFeature = new Map<string, { calls: number; tokens: number }>();
  let totalTokens = 0;
  let totalCredits = 0;
  let totalCostUsd = 0;
  let totalCostInr = 0;

  for (const row of rows) {
    const tokens = Number(row.total_tokens) || 0;
    const credits = Number(row.credits_used) || 0;
    const costUsd = Number(row.cost_usd) || 0;
    const costInr = Number(row.cost_inr) || 0;
    totalTokens += tokens;
    totalCredits += credits;
    totalCostUsd += costUsd;
    totalCostInr += costInr;
    const feature = String(row.feature_name || "unknown");
    const entry = byFeature.get(feature) || { calls: 0, tokens: 0 };
    entry.calls += 1;
    entry.tokens += tokens;
    byFeature.set(feature, entry);
  }

  let mostUsedFeature: string | null = null;
  let maxTokens = -1;
  for (const [feature, data] of byFeature.entries()) {
    if (data.tokens > maxTokens) {
      maxTokens = data.tokens;
      mostUsedFeature = feature;
    }
  }

  const totalCreditsAvailable = Math.max(0, Number(userCredits?.total_credits) || 0);
  const usedCredits = Math.max(0, Number(userCredits?.used_credits) || 0);

  return {
    totalTokens,
    totalCredits,
    totalCostUsd,
    totalCostInr,
    mostUsedFeature,
    totalCreditsAvailable,
    usedCredits,
    remainingCredits: Math.max(0, totalCreditsAvailable - usedCredits),
  };
}

export async function getAiUsageHistory(userId: string, limit = 50): Promise<AiUsageHistoryRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_usage")
    .select("id,feature_name,total_tokens,credits_used,cost_usd,cost_inr,cache_hit,model_used,provider,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(200, limit)));
  if (error) {
    throw new Error(`Failed to query ai_usage history: ${error.message}`);
  }

  return (data || []).map((row) => ({
    id: String(row.id),
    feature_name: String(row.feature_name),
    total_tokens: Number(row.total_tokens) || 0,
    credits_used: Number(row.credits_used) || 0,
    cost_usd: row.cost_usd == null ? null : Number(row.cost_usd),
    cost_inr: row.cost_inr == null ? null : Number(row.cost_inr),
    cache_hit: Boolean(row.cache_hit),
    model_used: row.model_used == null ? null : String(row.model_used),
    provider: row.provider == null ? null : String(row.provider),
    created_at: String(row.created_at),
  }));
}

export async function getAiUsageFeatureBreakdown(userId: string): Promise<AiFeatureBreakdownRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_usage")
    .select("feature_name,total_tokens,credits_used,cost_usd,cost_inr")
    .eq("user_id", userId);
  if (error) {
    throw new Error(`Failed to query ai_usage feature breakdown: ${error.message}`);
  }

  const rows = data || [];
  const byFeature = new Map<string, AiFeatureBreakdownRow>();
  for (const row of rows) {
    const feature = String(row.feature_name || "unknown");
    const existing = byFeature.get(feature) || {
      feature_name: feature,
      calls: 0,
      total_tokens: 0,
      total_credits: 0,
      total_cost_usd: 0,
      total_cost_inr: 0,
    };
    existing.calls += 1;
    existing.total_tokens += Number(row.total_tokens) || 0;
    existing.total_credits += Number(row.credits_used) || 0;
    existing.total_cost_usd += Number(row.cost_usd) || 0;
    existing.total_cost_inr += Number(row.cost_inr) || 0;
    byFeature.set(feature, existing);
  }

  return Array.from(byFeature.values()).sort((a, b) => b.total_tokens - a.total_tokens);
}

