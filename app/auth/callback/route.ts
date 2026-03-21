import { createClient } from "@/lib/supabase/server";
import { ensureUserRow } from "@/lib/auth";
import { sanitizeRedirectPath } from "@/lib/validation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next"));
  const role = searchParams.get("role");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await ensureUserRow(data.user.id, data.user.email ?? "");

      // Set role if provided during signup
      if (role === "recruiter" || role === "job_seeker") {
        await supabase
          .from("users")
          .update({ role })
          .eq("id", data.user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
