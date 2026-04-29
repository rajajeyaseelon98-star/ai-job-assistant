import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Default app path after login or when redirecting authenticated users away from `/`, `/login`, `/signup`.
 * Matches `app/login/page.tsx` and `app/auth/callback/route.ts` (last_active_role ?? role).
 */
export async function getDefaultAppPath(
  supabase: SupabaseClient,
  userId: string,
  e2eRole: "recruiter" | "job_seeker" | null
): Promise<string> {
  if (e2eRole) {
    return e2eRole === "recruiter" ? "/recruiter" : "/dashboard";
  }
  const { data: row } = await supabase
    .from("users")
    .select("role, last_active_role")
    .eq("id", userId)
    .maybeSingle();
  const mode = row?.last_active_role ?? row?.role ?? "job_seeker";
  return mode === "recruiter" ? "/recruiter" : "/dashboard";
}

/** Copy cookies from session refresh response onto a redirect (Supabase session refresh). */
export function redirectWithSessionCookies(sessionResponse: NextResponse, url: URL) {
  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie.name, cookie.value);
  });
  return redirect;
}
