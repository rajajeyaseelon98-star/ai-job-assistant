"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { userKeys, type UserData } from "@/hooks/queries/use-user";
import { AuthSplitShell } from "@/components/auth/auth-split-shell";
import { AuthTrustSignals } from "@/components/auth/auth-trust-signals";
import { getOAuthRedirectOrigin } from "@/lib/appUrl";

function GoogleGlyph() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const inputClass =
  "mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 sm:text-sm";

function LoginForm() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const next = searchParams.get("next") || "/dashboard";
      const origin = getOAuthRedirectOrigin();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        const msg = error.message.toLowerCase().includes("provider")
          ? "Google sign-in is not configured yet. Please use email login instead."
          : error.message;
        setMessage({ type: "error", text: msg });
        setGoogleLoading(false);
        return;
      }

      if (!data?.url) {
        setMessage({
          type: "error",
          text: "Unable to start Google sign-in. Please retry or continue with email.",
        });
        setGoogleLoading(false);
        return;
      }

      // In standalone PWA mode, explicit navigation is more reliable than implicit SDK redirects.
      window.location.assign(data.url);

      // If navigation does not happen (popup blockers/webview constraints), recover gracefully.
      window.setTimeout(() => {
        setGoogleLoading(false);
        setMessage({
          type: "error",
          text: "Google sign-in did not open. Tap again, or open this app URL in Chrome and retry.",
        });
      }, 8000);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to start Google sign-in";
      setMessage({ type: "error", text });
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    const next = searchParams.get("next") || "/dashboard";
    const safePath = next.startsWith("/") && !next.startsWith("//") && !next.includes("://") ? next : "/dashboard";

    // Role-aware redirect: default /dashboard → last active mode (same as users.role after switch)
    let redirectPath = safePath;
    if (safePath === "/dashboard" && authData.user) {
      try {
        const userData = await queryClient.fetchQuery({
          queryKey: userKeys.me(),
          queryFn: () => apiFetch<UserData>("/api/user"),
        });
        const mode = userData.last_active_role ?? userData.role;
        if (mode === "recruiter") redirectPath = "/recruiter";
      } catch {
        /* fallback to /dashboard */
      }
    }

    router.push(redirectPath);
    router.refresh();
  }

  return (
    <AuthSplitShell>
      <div className="w-full">
        {/* Mobile brand */}
        <Link
          href="/"
          className="font-display mb-6 inline-block text-lg font-semibold tracking-tight text-slate-900 lg:hidden"
        >
          AI Job Assistant
        </Link>

        <header>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Welcome back</h1>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Sign in to continue — get 3× more interviews with AI.
          </p>
        </header>

        {/* Google SSO */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="mt-8 flex w-full min-h-[44px] items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" aria-hidden />
          ) : (
            <GoogleGlyph />
          )}
          {googleLoading ? "Signing you in…" : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400">or sign in with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading || googleLoading}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading || googleLoading}
              className={inputClass}
            />
          </div>
          {message && (
            <p
              role="alert"
              className={`text-sm ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Signing you in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-slate-500">
          <Link href="/login/reset" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Forgot password?
          </Link>
        </p>

        <AuthTrustSignals />
      </div>
    </AuthSplitShell>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden />
        <span className="text-sm text-slate-500">Loading…</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
