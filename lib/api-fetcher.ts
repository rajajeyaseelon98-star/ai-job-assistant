import { formatApiError, parseErrorFieldsFromJson } from "@/lib/api-error";

/**
 * Shared fetch wrapper for TanStack Query hooks.
 * Throws on non-OK responses so React Query treats them as errors.
 *
 * For one-off `fetch` calls that need `{ error, detail }` parsing, use
 * `parseApiErrorJson` / `parseErrorFieldsFromJson` from `@/lib/api-error`.
 *
 * **`apiFetchJsonWithHumanizer`** / **`apiFetchFormJsonWithHumanizer`:** JSON APIs that map
 * server `{ error, detail }` through a friendly `humanize*` helper (see `hooks/mutations/*`).
 */

function errorTextFromResponseBody(body: string, status: number): string {
  if (!body.trim()) return `API error ${status}`;
  try {
    const parsed = JSON.parse(body) as unknown;
    return formatApiError(parseErrorFieldsFromJson(parsed)) || body;
  } catch {
    return body;
  }
}

/** JSON request/response; non-OK bodies parsed then passed through `humanize`. */
export async function apiFetchJsonWithHumanizer<T>(
  url: string,
  init: RequestInit | undefined,
  humanize: (message: string) => string
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(humanize(errorTextFromResponseBody(body, res.status)));
  }
  return res.json() as Promise<T>;
}

/** Multipart POST (e.g. upload); parses JSON body on success. */
export async function apiFetchFormJsonWithHumanizer<T>(
  url: string,
  formData: FormData,
  humanize: (message: string) => string
): Promise<T> {
  const res = await fetch(url, { method: "POST", body: formData });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(humanize(errorTextFromResponseBody(text, res.status)));
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

/** Multipart POST; JSON body on success (same error parsing as `apiFetchFormJsonWithHumanizer`, no humanizer). */
export async function apiFetchMultipartJson<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: formData });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(errorTextFromResponseBody(text, res.status));
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export async function apiFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `API error ${res.status}`);
  }
  return res.json();
}

/** Like `apiFetch` but returns the response body as a `Blob` (e.g. DOCX export). */
export async function apiFetchBlob(url: string, init?: RequestInit): Promise<Blob> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `API error ${res.status}`);
  }
  return res.blob();
}
