import { isGeminiAvailable, geminiGenerate, geminiGenerateContent } from "./gemini";
import { isOpenAIAvailable, chatCompletion } from "./openai";

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
 * Standardized AI generation: single prompt style.
 * Prefers Gemini, falls back to OpenAI on quota/429.
 */
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
