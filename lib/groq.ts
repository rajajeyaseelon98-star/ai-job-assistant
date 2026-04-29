type GroqChatCompletionResponse = {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string; type?: string; code?: string };
};

/** Returns true if a Groq API key is configured. */
export function isGroqAvailable(): boolean {
  return !!process.env.GROQ_API_KEY?.trim();
}

function getGroqConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured. Add it to .env.local.");
  }
  const model = (process.env.GROQ_MODEL || "llama-3.3-70b-versatile").trim();
  return { apiKey, model };
}

export async function groqChatCompletion(
  systemPrompt: string,
  userContent: string,
  options?: { jsonMode?: boolean }
): Promise<string> {
  const { apiKey, model } = getGroqConfig();

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      // Groq is OpenAI-compatible; this is supported for many models.
      response_format: options?.jsonMode ? { type: "json_object" } : undefined,
      temperature: 0.2,
    }),
  });

  const text = await res.text().catch(() => "");
  let parsed: GroqChatCompletionResponse | null = null;
  try {
    parsed = text ? (JSON.parse(text) as GroqChatCompletionResponse) : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const msg =
      parsed?.error?.message ||
      (text ? text.slice(0, 500) : "") ||
      `Groq error ${res.status}`;
    throw new Error(`${res.status} ${msg}`);
  }

  const content = parsed?.choices?.[0]?.message?.content ?? "";
  if (!content) {
    throw new Error("Groq returned no content.");
  }
  return content;
}

