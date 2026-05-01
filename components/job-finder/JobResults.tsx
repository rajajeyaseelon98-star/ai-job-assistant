"use client";

import { useState } from "react";
import { ExternalLink, MapPin, DollarSign, Sparkles, Building2, Filter } from "lucide-react";
import type { JobResult } from "@/types/jobFinder";
import { Select } from "@/components/ui/Input";

interface JobResultsProps {
  jobs: JobResult[];
  searchQuery: string;
}

export function JobResults({ jobs, searchQuery }: JobResultsProps) {
  const [sourceFilter, setSourceFilter] = useState<"all" | "Adzuna" | "AI Suggested">("all");

  const sources = Array.from(new Set(jobs.map((j) => j.source)));
  const filtered = sourceFilter === "all" ? jobs : jobs.filter((j) => j.source === sourceFilter);

  function formatSalary(min?: number, max?: number, currency?: string) {
    if (!min && !max) return null;
    const fmt = (n: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 0,
      }).format(n);
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max!)}`;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div>
          <h3 className="mb-2 font-display text-2xl font-bold text-text">
            {filtered.length} Jobs Found
          </h3>
          {searchQuery && (
            <p className="mb-6 text-sm text-text-muted">Matching: {searchQuery}</p>
          )}
          <p className="mt-2 text-xs text-text-muted max-w-2xl">
            Each card shows its <strong className="text-text">source</strong> (e.g. Adzuna = external listings;
            &quot;AI Suggested&quot; = ranked matches from our index). We label everything so you know where jobs come from.
          </p>
          <p className="mt-2 text-xs text-text-muted max-w-2xl border-l-2 border-primary/30 pl-3">
            <strong className="text-text">Coming next:</strong> recruiter-posted roles and jobs hosted on our platform
            (Phase 2+) will appear here with clear &quot;Internal&quot; / &quot;Recruiter&quot; badges — reducing reliance on
            external feeds alone.
          </p>
        </div>

        {sources.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-text-muted shrink-0" />
            <Select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
              className="w-full rounded-xl sm:w-auto"
            >
              <option value="all">All Sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filtered.map((job) => (
          <div
            key={job.id}
            className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
          >
            <div className="mb-2 sm:mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 pr-24 font-display text-lg font-bold text-text transition-colors group-hover:text-primary">{job.title}</h4>
                <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-text">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{job.company}</span>
                </div>
              </div>
              <span
                className={`absolute top-6 right-6 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  job.source === "Adzuna"
                    ? "border border-border bg-surface-muted text-text-muted"
                    : "border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
                }`}
              >
                {job.source}
              </span>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-text-muted">
            {job.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                {job.location}
              </div>
            )}

            {(job.salary_min || job.salary_max) && (
              <div className="flex items-center gap-1 font-medium text-emerald-600">
                <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                {formatSalary(job.salary_min, job.salary_max, job.currency)}
              </div>
            )}
            </div>

            {job.description && (
              <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-text-muted">{job.description}</p>
            )}

            {job.match_reason && (
              <div className="mt-auto mb-4 flex items-start gap-3 rounded-xl border border-primary/15 bg-surface-muted p-4">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-sm leading-relaxed text-text">{job.match_reason}</span>
              </div>
            )}

            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text transition-all hover:border-primary/30 hover:bg-surface-muted hover:text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Apply Now
              </a>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm sm:text-base text-text-muted py-8 sm:py-12">
          No jobs found for the selected filter.
        </p>
      )}
    </div>
  );
}
