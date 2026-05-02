import { headers } from "next/headers";

/**
 * Public base URL for server-side absolute links (emails, notifications).
 * Import only from Server Components, Route Handlers, or server utilities — not from `"use client"` modules.
 *
 * Priority:
 * - `NEXT_PUBLIC_APP_URL` (recommended, e.g. https://yourdomain.com)
 * - Vercel URL headers
 * - Request Host header (fallback)
 */
export async function getAppBaseUrl(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (explicit) return explicit;

  const h = await headers();
  const vercelProto = h.get("x-forwarded-proto") || "https";
  const vercelHost = h.get("x-forwarded-host") || h.get("host");
  if (vercelHost) return `${vercelProto}://${vercelHost}`.replace(/\/+$/, "");

  return "http://localhost:3000";
}
