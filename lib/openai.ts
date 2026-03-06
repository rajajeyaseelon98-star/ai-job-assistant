import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey) {
  console.warn("OPENAI_API_KEY is not set; AI features will fail.");
}

const openai = new OpenAI({
  apiKey: apiKey || "",
});

export { openai };
export default openai;

export async function chatCompletion(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean }
) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to .env.local.");
  }
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
