import { isGeminiAvailable, geminiGenerate, geminiGenerateContent } from "./gemini";
import { isOpenAIAvailable, chatCompletion } from "./openai";
import { generateCacheKey, getCachedResponse, setCachedResponse } from "./aiCache";

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

/**
 * Standardized AI generation: prefers Gemini, falls back to OpenAI on quota/429.
 * Uses system+user prompt style (geminiGenerate / chatCompletion).
 */
export async function aiGenerate(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean }
): Promise<string> {
  if (isGeminiAvailable()) {
    try {
      return await geminiGenerate(systemPrompt, userContent, options);
    } catch (err) {
      if (isQuotaOrRateLimitError(err) && isOpenAIAvailable()) {
        return chatCompletion(systemPrompt, userContent, options);
      }
      throw err;
    }
  }
  return chatCompletion(systemPrompt, userContent, options);
}

/**
 * Cached version of aiGenerate. Checks cache first, stores result on miss.
 */
export async function cachedAiGenerate(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean; cacheFeature?: string }
): Promise<string> {
  const feature = options?.cacheFeature || "general";
  const hash = generateCacheKey(feature, systemPrompt + userContent);

  const cached = await getCachedResponse(hash);
  if (cached) return cached;

  const result = await aiGenerate(systemPrompt, userContent, options);
  await setCachedResponse(hash, result, feature);
  return result;
}

/**
 * Cached version of aiGenerateContent. Checks cache first, stores result on miss.
 */
export async function cachedAiGenerateContent(
  prompt: string,
  cacheFeature?: string
): Promise<string> {
  const feature = cacheFeature || "general";
  const hash = generateCacheKey(feature, prompt);

  const cached = await getCachedResponse(hash);
  if (cached) return cached;

  const result = await aiGenerateContent(prompt);
  await setCachedResponse(hash, result, feature);
  return result;
}

export async function aiGenerateContent(prompt: string): Promise<string> {
  if (isGeminiAvailable()) {
    try {
      return await geminiGenerateContent(prompt);
    } catch (err) {
      if (isQuotaOrRateLimitError(err) && isOpenAIAvailable()) {
        return chatCompletion("You are a helpful assistant.", prompt);
      }
      throw err;
    }
  }
  return chatCompletion("You are a helpful assistant.", prompt);
}
