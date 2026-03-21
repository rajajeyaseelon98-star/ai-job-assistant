import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

type CookieTuple = { name: string; value: string; options?: Record<string, unknown> };

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Protect dashboard and API routes (except auth-related)
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/resume-analyzer") ||
    pathname.startsWith("/job-match") ||
    pathname.startsWith("/job-finder") ||
    pathname.startsWith("/auto-apply") ||
    pathname.startsWith("/smart-apply") ||
    pathname.startsWith("/tailor-resume") ||
    pathname.startsWith("/cover-letter") ||
    pathname.startsWith("/interview-prep") ||
    pathname.startsWith("/import-linkedin") ||
    pathname.startsWith("/job-board") ||
    pathname.startsWith("/applications") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/salary-insights") ||
    pathname.startsWith("/skill-demand") ||
    pathname.startsWith("/resume-performance") ||
    pathname.startsWith("/career-coach") ||
    pathname.startsWith("/streak-rewards") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/select-role") ||
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/pricing") ||
    pathname.startsWith("/settings") ||
    (pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/platform-stats") &&
      !pathname.startsWith("/api/share-result") &&
      !pathname.startsWith("/api/share/"));

  if (isProtected) {
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
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // For API routes, return 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // For pages, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // #22: Check email verification for non-API routes
    if (!pathname.startsWith("/api/") && !user.email_confirmed_at) {
      const verifyUrl = new URL("/login", request.url);
      verifyUrl.searchParams.set("error", "verify");
      return NextResponse.redirect(verifyUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
