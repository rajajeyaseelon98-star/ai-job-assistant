import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface AiUsageLogInput {
  userId?: string | null;
  featureName: string;
  provider: "gemini" | "openai" | "unknown";
  modelUsed: string;
  promptText?: string;
  completionText?: string;
  promptTokens?: number;
  completionTokens?: number;
  cacheHit: boolean;
  latencyMs: number;
  meta?: Record<string, unknown>;
}

async function getUsageClient() {
  const admin = createServiceRoleClient();
  if (admin) return admin;
  try {
    return await createServerClient();
  } catch {
    return null;
  }
}

export function estimateTokensFromText(text: string | undefined | null): number {
  if (!text) return 0;
  return Math.max(0, Math.ceil(text.length / 4));
}

export function calculateCredits(totalTokens: number): number {
  return Math.ceil(Math.max(0, totalTokens) / 1000);
}

function getUsdRatePerMillion(modelUsed: string): number | null {
  const envDefault = Number(process.env.AI_USAGE_DEFAULT_USD_PER_MILLION ?? "");
  if (Number.isFinite(envDefault) && envDefault > 0) return envDefault;

  const model = modelUsed.toLowerCase();
  if (model.includes("gpt-4o-mini")) return 0.75;
  if (model.includes("gemini-2.5-flash")) return 0.35;
  return null;
}

function computeCostUsd(totalTokens: number, modelUsed: string): number | null {
  const rate = getUsdRatePerMillion(modelUsed);
  if (!rate) return null;
  return (Math.max(0, totalTokens) / 1_000_000) * rate;
}

function usdToInr(usd: number | null): number | null {
  if (usd == null) return null;
  const fx = Number(process.env.AI_USAGE_USD_TO_INR ?? "83");
  return usd * (Number.isFinite(fx) && fx > 0 ? fx : 83);
}

export async function logAiUsage(input: AiUsageLogInput): Promise<void> {
  const supabase = await getUsageClient();
  if (!supabase) {
    console.warn("[ai-usage] no Supabase client available for logging");
    return;
  }

  const promptTokens = Math.max(
    0,
    Number.isFinite(input.promptTokens) ? Number(input.promptTokens) : estimateTokensFromText(input.promptText)
  );
  const completionTokens = Math.max(
    0,
    Number.isFinite(input.completionTokens)
      ? Number(input.completionTokens)
      : estimateTokensFromText(input.completionText)
  );
  const totalTokens = promptTokens + completionTokens;
  const creditsUsed = calculateCredits(totalTokens);
  const costUsd = computeCostUsd(totalTokens, input.modelUsed);
  const costInr = usdToInr(costUsd);

  const { error } = await supabase.from("ai_usage").insert({
    user_id: input.userId || null,
    feature_name: input.featureName,
    provider: input.provider,
    model_used: input.modelUsed,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    credits_used: creditsUsed,
    cost_usd: costUsd,
    cost_inr: costInr,
    cache_hit: input.cacheHit,
    latency_ms: Math.max(0, Math.round(input.latencyMs)),
    meta: input.meta ?? {},
  });
  if (error) {
    console.warn("[ai-usage] log insert failed", error.message, {
      featureName: input.featureName,
      userId: input.userId ?? null,
      provider: input.provider,
      modelUsed: input.modelUsed,
    });
  }
}

export async function getUserCreditBalance(userId: string): Promise<{
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
} | null> {
  const supabase = await getUsageClient();
  if (!supabase) {
    console.warn("[ai-usage] no Supabase client available for credit balance");
    return null;
  }
  const { data, error } = await supabase
    .from("users")
    .select("total_credits, used_credits")
    .eq("id", userId)
    .single();
  if (error || !data) {
    console.warn("[ai-usage] failed to load credit balance", error?.message);
    return null;
  }
  const totalCredits = Math.max(0, Number(data.total_credits) || 0);
  const usedCredits = Math.max(0, Number(data.used_credits) || 0);
  return {
    totalCredits,
    usedCredits,
    remainingCredits: Math.max(0, totalCredits - usedCredits),
  };
}

export async function incrementUsedCredits(userId: string, creditsUsed: number): Promise<void> {
  if (creditsUsed <= 0) return;
  const supabase = await getUsageClient();
  if (!supabase) {
    console.warn("[ai-usage] no Supabase client available to increment credits");
    return;
  }
  const { data, error: readErr } = await supabase
    .from("users")
    .select("used_credits")
    .eq("id", userId)
    .single();
  if (readErr) {
    console.warn("[ai-usage] failed reading current used_credits", readErr.message);
    return;
  }
  const currentUsed = Math.max(0, Number(data?.used_credits) || 0);
  const { error: updateErr } = await supabase
    .from("users")
    .update({ used_credits: currentUsed + creditsUsed })
    .eq("id", userId);
  if (updateErr) {
    console.warn("[ai-usage] failed updating used_credits", updateErr.message, {
      userId,
      creditsUsed,
      currentUsed,
    });
  }
}

