import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set; AI features will fail.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export { openai };
export default openai;

export async function chatCompletion(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean }
) {
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
