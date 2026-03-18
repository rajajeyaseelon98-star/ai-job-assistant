"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-card p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-text">Sign up</h1>
        <p className="mt-1 text-sm sm:text-base text-text-muted">Create your AI Job Assistant account</p>

        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
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
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 sm:py-2 text-base sm:text-sm text-text min-h-[44px]"
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
              minLength={6}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 sm:py-2 text-base sm:text-sm text-text min-h-[44px]"
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
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 sm:py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50 min-h-[44px] active:scale-[0.98] transition-transform text-sm sm:text-base"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
