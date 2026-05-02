import { headers } from "next/headers";

/**
 * Canonical origin for OAuth (`redirectTo`), magic links (`emailRedirectTo`), and password-reset emails.
 *
 * **Why:** If `NEXT_PUBLIC_APP_URL` is unset, code falls back to `window.location.origin`. A PWA installed from
 * `http://localhost:3000` keeps that origin on the phone — Google then redirects to `localhost`, which is the
 * **device itself** (`ERR_CONNECTION_REFUSED`). Setting `NEXT_PUBLIC_APP_URL=https://your-production-domain`
 * on Vercel fixes OAuth even for those installs; users should still reinstall the PWA from production or remove
 * the old shortcut.
 *
 * Local dev: leave `NEXT_PUBLIC_APP_URL` unset so redirects stay on `http://localhost:*`.
 */
export function getOAuthRedirectOrigin(): string {
  const raw = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_URL : undefined;
  const canonical = raw?.trim().replace(/\/+$/, "");
  if (canonical) return canonical;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/**
 * Returns the best-known public base URL for absolute links.
 *
 * Priority:
 * - `NEXT_PUBLIC_APP_URL` (recommended, e.g. https://yourdomain.com)
 * - Vercel URL headers
 * - Request Host header (fallback)
 */
export async function getAppBaseUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const h = await headers();
  const vercelProto = h.get("x-forwarded-proto") || "https";
  const vercelHost = h.get("x-forwarded-host") || h.get("host");
  if (vercelHost) return `${vercelProto}://${vercelHost}`.replace(/\/+$/, "");

  return "http://localhost:3000";
}

