"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, X, ChevronRight } from "lucide-react";

const STORAGE_DISMISS = "start_here_checklist_dismissed";

export interface StartHereChecklistProps {
  hasAtsScore: boolean;
  hasJobMatch: boolean;
  hasTrackedApplication: boolean;
}

export function StartHereChecklist({
  hasAtsScore,
  hasJobMatch,
  hasTrackedApplication,
}: StartHereChecklistProps) {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(STORAGE_DISMISS) === "1");
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, []);

  const allDone = hasAtsScore && hasJobMatch && hasTrackedApplication;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_DISMISS, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (!ready) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-6 animate-pulse">
        <div className="h-5 w-48 rounded bg-gray-200" />
        <div className="mt-4 space-y-3">
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-10 rounded bg-gray-100" />
          <div className="h-10 rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  if (dismissed && !allDone) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-3 py-2 text-xs sm:text-sm text-text-muted">
        <span>First time? We can show the 3-step path again.</span>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(STORAGE_DISMISS);
            } catch {
              /* ignore */
            }
            setDismissed(false);
          }}
          className="font-medium text-primary hover:underline"
        >
          Show Start path
        </button>
      </div>
    );
  }

  if (dismissed && allDone) return null;

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 sm:p-5" aria-labelledby="start-here-title">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="start-here-title" className="text-base sm:text-lg font-semibold text-text">
            Your first win — 3 steps
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-text-muted">
            Do these in order. Everything else is optional until you&apos;re ready.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-2 text-text-muted hover:bg-white/80 hover:text-text"
          aria-label="Dismiss checklist"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ol className="mt-4 space-y-3">
        <li className="flex gap-3">
          {hasAtsScore ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium ${hasAtsScore ? "text-text-muted line-through" : "text-text"}`}>
              1. Upload or paste your resume and get an ATS score
            </p>
            {!hasAtsScore && (
              <Link
                href="/resume-analyzer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Open Resume Analyzer <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </li>
        <li className="flex gap-3">
          {hasJobMatch ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-medium ${hasJobMatch ? "text-text-muted line-through" : "text-text"}`}>
              2. Run Job Match to see fit and gaps for a role
            </p>
            {!hasJobMatch && (
              <Link href="/job-match" className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Open Job Match <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </li>
        <li className="flex gap-3">
          {hasTrackedApplication ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-medium ${hasTrackedApplication ? "text-text-muted line-through" : "text-text"}`}
            >
              3. Apply (auto or manual) and track in Applications
            </p>
            {!hasTrackedApplication && (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                <Link href="/auto-apply" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  AI Auto-Apply <ChevronRight className="h-4 w-4" />
                </Link>
                <span className="text-text-muted">·</span>
                <Link href="/applications" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Application tracker <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </li>
      </ol>

      {allDone && (
        <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
          You&apos;ve completed the core loop — explore Job Finder, tailoring, and more when you need them.
        </p>
      )}
    </section>
  );
}
