import Link from "next/link";
import { Sparkles } from "lucide-react";

/** In-product promise aligned with marketing: outcomes first (more interviews, we apply for you). */
export function ProductNarrativeBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-700/40 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900/40 px-5 py-5 sm:px-6 sm:py-6">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl"
        aria-hidden
      />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-indigo-600/20 blur-2xl" aria-hidden />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold leading-snug text-white sm:text-lg">
              Get up to <span className="text-indigo-200">3× more interviews</span> — we don&apos;t only score your resume, we help you{" "}
              <span className="whitespace-nowrap">apply automatically.</span>
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed text-slate-300">
              Follow <strong className="font-medium text-white">Start here</strong> below, then use{" "}
              <strong className="font-medium text-white">Explore more</strong> when you&apos;re ready for extras.
            </p>
          </div>
        </div>
        <Link
          href="/resume-analyzer"
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-100"
        >
          Begin with resume score
        </Link>
      </div>
    </div>
  );
}
