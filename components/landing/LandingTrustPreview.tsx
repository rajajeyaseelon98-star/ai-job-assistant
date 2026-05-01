import { BarChart3, LayoutDashboard } from "lucide-react";
import { landingContainer, landingSectionY } from "./landingShell";

/** Placeholder “logos” + product preview — swap for real assets later */
export function LandingTrustPreview({ audience }: { audience: "job_seeker" | "recruiter" }) {
  return (
    <section className={`border-y border-border bg-surface-muted/60 ${landingSectionY}`}>
      <div className={`${landingContainer}`}>
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
          Trusted by teams &amp; job seekers
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 opacity-80 grayscale">
          {["Acme", "Nova", "Vertex", "Skyline", "Pulse"].map((name) => (
            <span
              key={name}
              className="text-lg font-bold tracking-tight text-text-muted transition hover:text-text"
            >
              {name}
            </span>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-text-muted">
          {audience === "job_seeker"
            ? "10,000+ job seekers · Instant results"
            : "Used by recruiters & startups · Hiring speed"}
        </p>

        <div className="mx-auto mt-12 max-w-4xl">
          <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-foreground">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            Product preview
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card-md">
            <div className="flex items-center gap-2 border-b border-border bg-card/90 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
              </div>
              <span className="text-xs font-medium text-text-muted">
                {audience === "job_seeker" ? "Dashboard — Resume & matches" : "Dashboard — Candidates & pipeline"}
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-3">
              <div className="border-b border-border bg-card/70 p-4 md:border-b-0 md:border-r">
                <BarChart3 className="h-8 w-8 text-primary/80" />
                <p className="mt-3 text-xs font-medium text-text-muted">
                  {audience === "job_seeker" ? "ATS & job match" : "Shortlist & scores"}
                </p>
                <div className="mt-3 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/10" />
              </div>
              <div className="border-b border-border bg-card/50 p-4 md:border-b-0 md:border-r">
                <div className="h-24 rounded-lg bg-surface-muted" />
                <div className="mt-2 h-3 w-2/3 rounded bg-surface-muted" />
              </div>
              <div className="bg-card/70 p-4">
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-surface-muted" />
                  <div className="h-3 w-5/6 rounded bg-surface-muted" />
                  <div className="h-3 w-4/6 rounded bg-surface-muted" />
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-text-muted">
            Replace with real screenshots when ready — structure is wired for trust.
          </p>
        </div>
      </div>
    </section>
  );
}
