import { type NextRequest, NextResponse } from "next/server";
import { getDefaultAppPath, redirectWithSessionCookies } from "@/lib/auth-landing-path";
import { readE2eMockRoleFromCookies } from "@/lib/e2e-auth";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

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
    pathname.startsWith("/messages") ||
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
    (isApiRoute &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/platform-stats") &&
      !pathname.startsWith("/api/public/") &&
      !pathname.startsWith("/api/webhooks/") &&
      !pathname.startsWith("/api/internal/email-retry") &&
      !pathname.startsWith("/api/share-result") &&
      !pathname.startsWith("/api/share/"));

  let response: NextResponse;
  let user: Awaited<ReturnType<typeof updateSession>>["user"];
  let supabase: Awaited<ReturnType<typeof updateSession>>["supabase"];

  try {
    ({ response, user, supabase } = await updateSession(request));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown middleware error";
    console.error("[middleware] session bootstrap failed:", message);

    if (isProtected) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For unprotected routes, fail open instead of taking down the whole app.
    return NextResponse.next();
  }

  // Authenticated users: skip marketing landing and auth entry (standard SaaS behavior).
  if (user) {
    const isMarketingOrAuthEntry =
      pathname === "/" ||
      pathname === "/login" ||
      pathname.startsWith("/login/") ||
      pathname === "/signup" ||
      pathname.startsWith("/signup/");
    if (isMarketingOrAuthEntry) {
      if (!user.email_confirmed_at) {
        if (pathname.startsWith("/login")) {
          return response;
        }
        return redirectWithSessionCookies(
          response,
          new URL("/login?error=verify", request.url)
        );
      }
      const e2e = readE2eMockRoleFromCookies(request.cookies);
      const dest = await getDefaultAppPath(supabase, user.id, e2e);
      return redirectWithSessionCookies(response, new URL(dest, request.url));
    }
  }

  if (isProtected) {
    if (!user) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isApiRoute && !user.email_confirmed_at) {
      const verifyUrl = new URL("/login", request.url);
      verifyUrl.searchParams.set("error", "verify");
      return NextResponse.redirect(verifyUrl);
    }

    // Recruiter routes: require current profile role (defense in depth; layouts also guard).
    if (!isApiRoute && pathname.startsWith("/recruiter")) {
      const e2e = readE2eMockRoleFromCookies(request.cookies);
      if (e2e) {
        if (e2e !== "recruiter") {
          const u = new URL("/select-role", request.url);
          u.searchParams.set("next", pathname);
          return NextResponse.redirect(u);
        }
      } else {
        const { data: row } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (row?.role !== "recruiter") {
          const u = new URL("/select-role", request.url);
          u.searchParams.set("next", pathname);
          return NextResponse.redirect(u);
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
