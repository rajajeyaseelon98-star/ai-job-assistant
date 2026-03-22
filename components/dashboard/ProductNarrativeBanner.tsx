import Link from "next/link";
import { Sparkles } from "lucide-react";

/** In-product promise aligned with marketing: outcomes first (more interviews, we apply for you). */
export function ProductNarrativeBanner() {
  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-amber-50/40 px-4 py-3 sm:px-5 sm:py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-sm sm:text-base font-semibold text-text leading-snug">
              Get up to <span className="text-primary">3× more interviews</span> — we don&apos;t only score your resume, we help you{" "}
              <span className="whitespace-nowrap">apply automatically.</span>
            </p>
            <p className="mt-1 text-xs sm:text-sm text-text-muted">
              Follow <strong className="text-text font-medium">Start here</strong> below, then use{" "}
              <strong className="text-text font-medium">Explore more</strong> when you&apos;re ready for extras.
            </p>
          </div>
        </div>
        <Link
          href="/resume-analyzer"
          className="shrink-0 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.98] min-h-[44px]"
        >
          Begin with resume score
        </Link>
      </div>
    </div>
  );
}
