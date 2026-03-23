import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Split-screen auth chrome: brand + glass bento (desktop only) | white form column.
 * Headings use `font-display` (Plus Jakarta Sans); body uses Inter via `font-sans`.
 */
export function AuthSplitShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      {/* Left — brand anchor (desktop only) */}
      <aside className="relative hidden min-h-screen w-1/2 flex-col overflow-hidden bg-slate-900 lg:flex">
        {/* Soft indigo radial glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[min(120%,720px)] w-[min(120%,900px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl"
          aria-hidden
        />

        <div className="relative flex h-full min-h-screen flex-col px-10 py-10 xl:px-14">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-white transition hover:text-slate-200"
          >
            AI Job Assistant
          </Link>

          {/* Centered bento */}
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 border-t-white/20 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Outcomes
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                  +220%
                </span>
              </div>
              <p className="font-display mt-5 text-5xl font-bold tabular-nums tracking-tight text-white">
                3.2×
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                More interviews vs. manual applying
              </p>
              {/* Glowing trend line */}
              <div className="mt-6 h-12 w-full overflow-hidden rounded-lg bg-slate-800/50 ring-1 ring-white/10">
                <svg
                  className="h-full w-full"
                  viewBox="0 0 280 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="authTrend" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#34d399" stopOpacity="0.15" />
                      <stop offset="1" stopColor="#34d399" stopOpacity="0.6" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    d="M8 38 C 48 32, 72 28, 96 22 S 152 8, 188 12 S 248 4, 272 8"
                    stroke="url(#authTrend)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter="url(#glow)"
                  />
                  <path
                    d="M8 38 C 48 32, 72 28, 96 22 S 152 8, 188 12 S 248 4, 272 8"
                    stroke="#34d399"
                    strokeOpacity="0.85"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-xs text-slate-400">ATS match</span>
                <span className="font-display text-sm font-bold text-white">94%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} AI Job Assistant</span>
            <Link href="/contact" className="transition hover:text-slate-300">
              Help &amp; support
            </Link>
          </div>
        </div>
      </aside>

      {/* Right — functional area */}
      <main className="flex w-full min-h-screen flex-1 flex-col justify-center bg-white lg:w-1/2">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
