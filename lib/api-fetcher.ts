/**
 * Shared fetch wrapper for TanStack Query hooks.
 * Throws on non-OK responses so React Query treats them as errors.
 */
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
