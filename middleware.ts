import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/resume-analyzer") ||
    pathname.startsWith("/resume-builder") ||
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
      !pathname.startsWith("/api/public/") &&
      !pathname.startsWith("/api/share-result") &&
      !pathname.startsWith("/api/share/"));

  if (isProtected) {
    if (!user) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

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
