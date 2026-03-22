"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { landingContainer, landingSectionY } from "./landingShell";

/**
 * “See what you’ll get” — fake loading → three metric cards (feels dynamic).
 */
export function JobSeekerProofSection() {
  const [phase, setPhase] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    const t = setTimeout(() => setPhase("ready"), 1400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section className={`bg-background ${landingSectionY}`}>
      <div className={`${landingContainer} text-center`}>
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          See what you&apos;ll get instantly
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted md:text-base">
          Instant results — this is exactly what recruiters see.
        </p>

        {phase === "loading" ? (
          <div
            className="mx-auto mt-10 flex max-w-md flex-col items-center rounded-2xl border border-border bg-card p-10 shadow-card-md"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 font-semibold text-foreground">Analyzing resume…</p>
            <p className="mt-1 text-sm text-text-muted">Matching jobs &amp; ATS signals</p>
            <div className="mt-6 h-2 w-full max-w-xs overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-primary to-emerald-500" />
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3 md:gap-8">
            {[
              { label: "ATS score", value: "78%", sub: "↑ vs average" },
              { label: "Issues found", value: "12", sub: "fixable in seconds" },
              { label: "Matching jobs", value: "35", sub: "best-fit roles" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-border bg-card p-6 text-left shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{c.label}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums text-foreground">{c.value}</p>
                <p className="mt-1 text-sm text-text-muted">{c.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
