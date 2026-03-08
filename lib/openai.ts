import OpenAI from "openai";

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (_openai) return _openai;
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to .env.local.");
  }
  _openai = new OpenAI({ apiKey });
  return _openai;
}

/** Returns true if an OpenAI API key is configured. */
export function isOpenAIAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY?.trim();
}

export async function chatCompletion(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean }
) {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: options?.jsonMode ? { type: "json_object" } : undefined,
  });
  const content = res.choices[0]?.message?.content ?? "";
  return content;
}
