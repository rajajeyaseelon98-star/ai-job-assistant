"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sanitizeRedirectPath } from "@/lib/validation";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthSplitShell } from "@/components/auth/auth-split-shell";
import { AuthTrustSignals } from "@/components/auth/auth-trust-signals";

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

function SignupForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "recruiter" ? "recruiter" : "job_seeker";
  const nextFromUrl = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"job_seeker" | "recruiter">(initialRole);

  /** Post-OAuth / email confirm redirect (?next= respected for both roles when safe). */
  function redirectAfterAuth(forRole: "job_seeker" | "recruiter") {
    const def = forRole === "recruiter" ? "/recruiter" : "/onboarding";
    return sanitizeRedirectPath(nextFromUrl, def);
  }
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    setMessage(null);
    const supabase = createClient();
    const nextPath = redirectAfterAuth(role);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}&role=${role}`,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase().includes("provider")
        ? "Google sign-in is not configured yet. Please use email signup instead."
        : error.message;
      setMessage({ type: "error", text: msg });
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectAfterAuth(role))}&role=${role}`,
      },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({
      type: "success",
      text: "Check your email for the confirmation link, then log in.",
    });
    router.refresh();
  }

  return (
    <AuthSplitShell>
      <div className="w-full">
        <Link
          href="/"
          className="font-display mb-6 inline-block text-lg font-semibold tracking-tight text-slate-900 lg:hidden"
        >
          AI Job Assistant
        </Link>

        <header>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Create your account
          </h1>
          <p className="mt-2 text-base leading-relaxed text-slate-500">
            Start free — tailor your resume and land interviews faster.
          </p>
        </header>

        {/* Role — premium segmented control */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">I am a</p>
          <div
            className="inline-flex w-full rounded-full bg-slate-100/90 p-1 shadow-inner ring-1 ring-slate-200/80 sm:w-auto"
            role="tablist"
            aria-label="Account type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={role === "job_seeker"}
              onClick={() => setRole("job_seeker")}
              disabled={loading || googleLoading}
              className={`min-h-[40px] flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 sm:min-w-[140px] sm:flex-none ${
                role === "job_seeker"
                  ? "bg-white text-slate-900 shadow-md shadow-slate-200/50 ring-1 ring-slate-200/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Job Seeker
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={role === "recruiter"}
              onClick={() => setRole("recruiter")}
              disabled={loading || googleLoading}
              className={`min-h-[40px] flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 sm:min-w-[140px] sm:flex-none ${
                role === "recruiter"
                  ? "bg-white text-slate-900 shadow-md shadow-slate-200/50 ring-1 ring-slate-200/80"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Recruiter
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading || loading}
          className="mt-8 flex w-full min-h-[44px] items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" aria-hidden />
          ) : (
            <GoogleGlyph />
          )}
          {googleLoading ? "Signing you up…" : "Continue with Google"}
        </button>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400">or sign up with email</span>
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
              minLength={6}
              autoComplete="new-password"
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
                Creating your account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Log in
          </Link>
        </p>

        <AuthTrustSignals />
      </div>
    </AuthSplitShell>
  );
}

function SignupFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" aria-hidden />
        <span className="text-sm text-slate-500">Loading…</span>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm />
    </Suspense>
  );
}
