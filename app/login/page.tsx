"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, TrendingUp, Users } from "lucide-react";

function LoginForm() {
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
    const supabase = createClient();
    const next = searchParams.get("next") || "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      const msg = error.message.toLowerCase().includes("provider")
        ? "Google sign-in is not configured yet. Please use email login instead."
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    const next = searchParams.get("next") || "/dashboard";
    const safePath = next.startsWith("/") && !next.startsWith("//") && !next.includes("://") ? next : "/dashboard";
    router.push(safePath);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-200 bg-card p-6 sm:p-8 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-text">Welcome back</h1>
          <p className="mt-1 text-sm sm:text-base text-text-muted">
            Get 3× more interviews — sign in to continue
          </p>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-text shadow-sm hover:bg-gray-50 disabled:opacity-50 min-h-[44px] active:scale-[0.98] transition-transform"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Signing you in…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="relative mt-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-text-muted">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 sm:py-2 text-base sm:text-sm text-text min-h-[44px] disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || googleLoading}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 sm:py-2 text-base sm:text-sm text-text min-h-[44px] disabled:opacity-60"
              />
            </div>
            {message && (
              <p
                className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}
              >
                {message.text}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded-lg bg-primary py-2.5 sm:py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50 min-h-[44px] active:scale-[0.98] transition-transform text-sm sm:text-base"
            >
              {loading ? "Signing you in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-text-muted">
            <Link href="/login/reset" className="text-primary hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>

        {/* Trust signals */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col items-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-[11px] text-text-muted leading-tight">3.2x more interviews</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-[11px] text-text-muted leading-tight">10,000+ users</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Shield className="h-4 w-4 text-purple-500" />
            <span className="text-[11px] text-text-muted leading-tight">Secure & private</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
