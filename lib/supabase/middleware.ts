import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  buildSupabaseUserFromE2eRole,
  readE2eMockRoleFromCookies,
} from "@/lib/e2e-auth";

type CookieTuple = { name: string; value: string; options?: Record<string, unknown> };

/**
 * Refresh the Supabase session and return the authenticated user (if any).
 * Callers can reuse the returned user to avoid a second auth round-trip.
 * `supabase` is the same client (for follow-up queries like `public.users.role`).
 */
export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
  supabase: SupabaseClient;
}> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieTuple[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const e2eRole = readE2eMockRoleFromCookies(request.cookies);
  const user = authUser ?? (e2eRole ? buildSupabaseUserFromE2eRole(e2eRole) : null);
  return { response: supabaseResponse, user, supabase };
}
