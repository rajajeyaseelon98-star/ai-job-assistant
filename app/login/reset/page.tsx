"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=1`,
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-card p-6 sm:p-8 shadow-sm text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-text">Check your email</h1>
          <p className="mt-2 text-sm sm:text-base text-text-muted">
            If an account exists for {email}, we sent a password reset link.
          </p>
          <Link href="/login" className="mt-6 inline-block text-primary hover:underline text-sm sm:text-base min-h-[44px] inline-flex items-center justify-center">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-card p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-text">Reset password</h1>
        <p className="mt-1 text-sm sm:text-base text-text-muted">Enter your email to receive a reset link.</p>

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
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 sm:py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50 min-h-[44px] active:scale-[0.98] transition-transform text-sm sm:text-base"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-text-muted">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
