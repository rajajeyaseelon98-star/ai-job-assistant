/**
 * Parse JSON error bodies from API responses (NextResponse.json({ error, detail })).
 */

export type ApiErrorFields = {
  error?: string;
  detail?: string;
};

/** Read body once; safe if server returned non-JSON. */
export async function parseApiErrorJson(res: Response): Promise<ApiErrorFields> {
  const text = await res.text();
  if (!text) return {};
  try {
    const j = JSON.parse(text) as Record<string, unknown>;
    return {
      error: typeof j.error === "string" ? j.error : undefined,
      detail: typeof j.detail === "string" ? j.detail : undefined,
    };
  } catch {
    return { error: text.slice(0, 300) };
  }
}

export function parseErrorFieldsFromJson(body: unknown): ApiErrorFields {
  if (!body || typeof body !== "object") return {};
  const o = body as Record<string, unknown>;
  return {
    error: typeof o.error === "string" ? o.error : undefined,
    detail: typeof o.detail === "string" ? o.detail : undefined,
  };
}

export function formatApiError(parsed: ApiErrorFields): string {
  if (parsed.error && parsed.detail) return `${parsed.error}: ${parsed.detail}`;
  if (parsed.error) return parsed.error;
  if (parsed.detail) return parsed.detail;
  return "";
}

/** For errors thrown by `apiFetch` (message is often a JSON error body string). */
export function formatApiFetchThrownError(error: unknown): string {
  if (!(error instanceof Error) || !error.message) {
    return "Something went wrong";
  }
  try {
    const parsed = JSON.parse(error.message) as unknown;
    const fields = parseErrorFieldsFromJson(parsed);
    const formatted = formatApiError(fields);
    if (formatted) return formatted;
  } catch {
    /* not JSON */
  }
  const msg = error.message.trim();
  return msg || "Something went wrong";
}
