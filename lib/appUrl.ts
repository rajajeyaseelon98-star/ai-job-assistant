import { headers } from "next/headers";

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

