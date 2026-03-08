import { GoogleGenerativeAI } from "@google/generative-ai";

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (_genAI) return _genAI;
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Add it to .env.local.");
  }
  _genAI = new GoogleGenerativeAI(apiKey);
  return _genAI;
}

/** Returns true if a Gemini API key is configured. */
export function isGeminiAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY?.trim();
}

/**
 * Generate content with Gemini. Returns raw text.
 * When jsonMode is true, uses responseMimeType: application/json for structured output.
 */
export async function geminiGenerate(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean }
): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: options?.jsonMode
      ? { responseMimeType: "application/json" }
      : undefined,
  });
  const fullPrompt = `${systemPrompt}\n\n---\n\n${userContent}`;
  const result = await model.generateContent(fullPrompt);
  const response = result.response;
  const text = response.text();
  if (!text) {
    throw new Error("Gemini returned no text.");
  }
  return text;
}

/**
 * Simple generateContent: single prompt, returns raw text. Uses gemini-2.5-flash.
 */
export async function geminiGenerateContent(prompt: string): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  if (!text) throw new Error("Gemini returned no text.");
  return text;
}
