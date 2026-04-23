import { isGeminiAvailable, geminiGenerate, geminiGenerateContent } from "./gemini";
import { isOpenAIAvailable, chatCompletion } from "./openai";
import { generateCacheKey, getCachedResponse, setCachedResponse } from "./aiCache";
import { parseJsonLoose } from "./aiJson";
import { BASE_OUTPUT_GUARD } from "./aiPromptFactory";
import {
  isAiCreditsEnforcementEnabled,
  isAiPromptSystemEnabled,
  isAiTelemetryEnabled,
  isAiUsageTrackingEnabled,
} from "./aiRollout";
import { calculateCredits, estimateTokensFromText, getUserCreditBalance, incrementUsedCredits, logAiUsage } from "./aiUsage";

function isQuotaOrRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("Too Many Requests") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("Quota exceeded")
  );
}

type AiProvider = "gemini" | "openai" | "unknown";

interface AiGenerateResult {
  text: string;
  provider: AiProvider;
  modelUsed: string;
}

/** Result type for cached AI calls, includes whether the result came from cache. */
export interface CachedAiResult {
  text: string;
  fromCache: boolean;
}

async function enforceCreditsBeforeCall(userId?: string): Promise<void> {
  if (!userId || !isAiCreditsEnforcementEnabled()) return;
  const balance = await getUserCreditBalance(userId);
  if (balance && balance.remainingCredits <= 0) throw new Error("CREDITS_EXHAUSTED");
}

async function trackAiUsageAfterCall(input: {
  userId?: string;
  featureName: string;
  provider: AiProvider;
  modelUsed: string;
  promptText: string;
  completionText: string;
  cacheHit: boolean;
  latencyMs: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  if (!isAiUsageTrackingEnabled()) return;

  await logAiUsage({
    userId: input.userId ?? null,
    featureName: input.featureName,
    provider: input.provider,
    modelUsed: input.modelUsed,
    promptText: input.promptText,
    completionText: input.completionText,
    cacheHit: input.cacheHit,
    latencyMs: input.latencyMs,
    meta: input.meta,
  });

  if (input.userId && isAiCreditsEnforcementEnabled() && !input.cacheHit) {
    const totalTokens = estimateTokensFromText(input.promptText) + estimateTokensFromText(input.completionText);
    await incrementUsedCredits(input.userId, calculateCredits(totalTokens));
  }
}

/**
 * Standardized AI generation: prefers Gemini, falls back to OpenAI on quota/429.
 * Uses system+user prompt style (geminiGenerate / chatCompletion).
 */
export async function aiGenerate(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean }
): Promise<string> {
  const result = await aiGenerateWithMeta(systemPrompt, userContent, options);
  return result.text;
}

async function aiGenerateWithMeta(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean }
): Promise<AiGenerateResult> {
  if (isGeminiAvailable()) {
    try {
      const text = await geminiGenerate(systemPrompt, userContent, options);
      return { text, provider: "gemini", modelUsed: "gemini-2.5-flash" };
    } catch (err) {
      if (isQuotaOrRateLimitError(err) && isOpenAIAvailable()) {
        const text = await chatCompletion(systemPrompt, userContent, options);
        return { text, provider: "openai", modelUsed: "gpt-4o-mini" };
      }
      throw err;
    }
  }
  const text = await chatCompletion(systemPrompt, userContent, options);
  return { text, provider: "openai", modelUsed: "gpt-4o-mini" };
}

/**
 * Cached version of aiGenerate. Checks cache first, stores result on miss.
 * Returns { text, fromCache } so callers can skip usage logging on cache hits.
 */
export async function cachedAiGenerate(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean; cacheFeature?: string; userId?: string; featureName?: string }
): Promise<string> {
  const result = await cachedAiGenerateWithMeta(systemPrompt, userContent, options);
  return result.text;
}

export async function cachedAiGenerateWithMeta(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean; cacheFeature?: string; userId?: string; featureName?: string }
): Promise<CachedAiResult> {
  const feature = options?.cacheFeature || "general";
  const featureName = options?.featureName || feature;
  const hash = generateCacheKey(feature, systemPrompt + userContent);

  const cached = await getCachedResponse(hash);
  if (cached) {
    trackAiUsageAfterCall({
      userId: options?.userId,
      featureName,
      provider: "unknown",
      modelUsed: "cache",
      promptText: systemPrompt + "\n\n" + userContent,
      completionText: cached,
      cacheHit: true,
      latencyMs: 0,
      meta: { source: "cachedAiGenerateWithMeta" },
    }).catch((err) => {
      console.warn("[ai-usage] failed to track cachedAiGenerateWithMeta cache hit", err);
    });
    return { text: cached, fromCache: true };
  }

  await enforceCreditsBeforeCall(options?.userId);
  const t0 = Date.now();
  const result = await aiGenerateWithMeta(systemPrompt, userContent, options);
  const latencyMs = Date.now() - t0;

  await setCachedResponse(hash, result.text, feature);
  trackAiUsageAfterCall({
    userId: options?.userId,
    featureName,
    provider: result.provider,
    modelUsed: result.modelUsed,
    promptText: systemPrompt + "\n\n" + userContent,
    completionText: result.text,
    cacheHit: false,
    latencyMs,
    meta: { source: "cachedAiGenerateWithMeta" },
  }).catch((err) => {
    console.warn("[ai-usage] failed to track cachedAiGenerateWithMeta miss", err);
  });
  return { text: result.text, fromCache: false };
}

/**
 * Cached version of aiGenerateContent. Checks cache first, stores result on miss.
 * Returns { text, fromCache } so callers can skip usage logging on cache hits.
 */
export async function cachedAiGenerateContent(
  prompt: string,
  cacheFeature?: string,
  options?: { userId?: string; featureName?: string }
): Promise<string> {
  const result = await cachedAiGenerateContentWithMeta(prompt, cacheFeature, options);
  return result.text;
}

export async function cachedAiGenerateContentWithMeta(
  prompt: string,
  cacheFeature?: string,
  options?: { userId?: string; featureName?: string }
): Promise<CachedAiResult> {
  const feature = cacheFeature || "general";
  const featureName = options?.featureName || feature;
  const hash = generateCacheKey(feature, prompt);

  const cached = await getCachedResponse(hash);
  if (cached) {
    trackAiUsageAfterCall({
      userId: options?.userId,
      featureName,
      provider: "unknown",
      modelUsed: "cache",
      promptText: prompt,
      completionText: cached,
      cacheHit: true,
      latencyMs: 0,
      meta: { source: "cachedAiGenerateContentWithMeta" },
    }).catch((err) => {
      console.warn("[ai-usage] failed to track cachedAiGenerateContentWithMeta cache hit", err);
    });
    return { text: cached, fromCache: true };
  }

  await enforceCreditsBeforeCall(options?.userId);
  const t0 = Date.now();
  const result = await aiGenerateContentWithMeta(prompt);
  const latencyMs = Date.now() - t0;

  await setCachedResponse(hash, result.text, feature);
  trackAiUsageAfterCall({
    userId: options?.userId,
    featureName,
    provider: result.provider,
    modelUsed: result.modelUsed,
    promptText: prompt,
    completionText: result.text,
    cacheHit: false,
    latencyMs,
    meta: { source: "cachedAiGenerateContentWithMeta" },
  }).catch((err) => {
    console.warn("[ai-usage] failed to track cachedAiGenerateContentWithMeta miss", err);
  });
  return { text: result.text, fromCache: false };
}

export async function aiGenerateContent(prompt: string): Promise<string> {
  const result = await aiGenerateContentWithMeta(prompt);
  return result.text;
}

async function aiGenerateContentWithMeta(prompt: string): Promise<AiGenerateResult> {
  if (isGeminiAvailable()) {
    try {
      const text = await geminiGenerateContent(prompt);
      return { text, provider: "gemini", modelUsed: "gemini-2.5-flash" };
    } catch (err) {
      if (isQuotaOrRateLimitError(err) && isOpenAIAvailable()) {
        const text = await chatCompletion("You are a helpful assistant.", prompt);
        return { text, provider: "openai", modelUsed: "gpt-4o-mini" };
      }
      throw err;
    }
  }
  const text = await chatCompletion("You are a helpful assistant.", prompt);
  return { text, provider: "openai", modelUsed: "gpt-4o-mini" };
}

type CachedAiJsonOptions<T> = {
  systemPrompt: string;
  userContent: string;
  cacheFeature?: string;
  normalize: (input: unknown) => T;
  retries?: number;
  rolloutKey?: string;
  telemetryTag?: string;
  userId?: string;
  featureName?: string;
};

/**
 * Strict JSON helper with:
 * - cache lookup
 * - tolerant extraction from fenced/extra text
 * - normalize callback
 * - one bounded retry with stricter guardrails
 *
 * The cache is only written after successful parse+normalize.
 */
export async function cachedAiGenerateJsonWithGuard<T>(options: CachedAiJsonOptions<T>): Promise<T> {
  const feature = options.cacheFeature || "general_json";
  const featureName = options.featureName || feature;
  const cacheKey = generateCacheKey(feature, options.systemPrompt + options.userContent);
  const retries = Math.max(0, Math.min(2, options.retries ?? 1));
  const promptSystemEnabled = isAiPromptSystemEnabled(options.rolloutKey);
  const telemetryEnabled = isAiTelemetryEnabled();
  const t0 = Date.now();
  let cacheHit = false;

  const parseAndNormalize = (raw: string): T => {
    const parsed = parseJsonLoose(raw);
    return options.normalize(parsed);
  };

  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    try {
      cacheHit = true;
      const normalized = parseAndNormalize(cached);
      trackAiUsageAfterCall({
        userId: options.userId,
        featureName,
        provider: "unknown",
        modelUsed: "cache",
        promptText: options.systemPrompt + "\n\n" + options.userContent,
        completionText: cached,
        cacheHit: true,
        latencyMs: 0,
        meta: { source: "cachedAiGenerateJsonWithGuard" },
      }).catch((err) => {
        console.warn("[ai-usage] failed to track cachedAiGenerateJsonWithGuard cache hit", err);
      });
      if (telemetryEnabled) {
        console.info("[ai-guard]", {
          tag: options.telemetryTag || feature,
          cacheFeature: feature,
          cacheHit,
          attempts: 0,
          mode: promptSystemEnabled ? "guarded" : "legacy",
          elapsedMs: Date.now() - t0,
        });
      }
      return normalized;
    } catch {
      // Continue to live generation when stale cache is malformed.
    }
  }

  await enforceCreditsBeforeCall(options.userId);
  let lastErr: unknown;
  const maxAttempts = promptSystemEnabled ? retries + 1 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const strictSuffix =
        attempt === 0
          ? ""
          : `\n\n${BASE_OUTPUT_GUARD}\nReturn only strict JSON. Do not wrap in markdown.`;
      const effectiveSystemPrompt = promptSystemEnabled
        ? options.systemPrompt + strictSuffix
        : options.systemPrompt;
      const generationStartedAt = Date.now();
      const generated = await aiGenerateWithMeta(effectiveSystemPrompt, options.userContent, { jsonMode: true });
      const raw = generated.text;
      const normalized = parseAndNormalize(raw);
      await setCachedResponse(cacheKey, raw, feature);
      trackAiUsageAfterCall({
        userId: options.userId,
        featureName,
        provider: generated.provider,
        modelUsed: generated.modelUsed,
        promptText: effectiveSystemPrompt + "\n\n" + options.userContent,
        completionText: raw,
        cacheHit: false,
        latencyMs: Date.now() - generationStartedAt,
        meta: { source: "cachedAiGenerateJsonWithGuard", attempts: attempt + 1 },
      }).catch((err) => {
        console.warn("[ai-usage] failed to track cachedAiGenerateJsonWithGuard miss", err);
      });
      if (telemetryEnabled) {
        console.info("[ai-guard]", {
          tag: options.telemetryTag || feature,
          cacheFeature: feature,
          cacheHit,
          attempts: attempt + 1,
          mode: promptSystemEnabled ? "guarded" : "legacy",
          elapsedMs: Date.now() - t0,
        });
      }
      return normalized;
    } catch (err) {
      lastErr = err;
    }
  }

  if (telemetryEnabled) {
    console.error("[ai-guard]", {
      tag: options.telemetryTag || feature,
      cacheFeature: feature,
      cacheHit,
      attempts: maxAttempts,
      mode: promptSystemEnabled ? "guarded" : "legacy",
      elapsedMs: Date.now() - t0,
      error: lastErr instanceof Error ? lastErr.message : String(lastErr),
    });
  }

  throw lastErr instanceof Error ? lastErr : new Error("Failed to generate valid JSON response");
}

