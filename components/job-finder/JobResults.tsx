"use client";

import { useState } from "react";
import { ExternalLink, MapPin, DollarSign, Sparkles, Building2, Filter } from "lucide-react";
import type { JobResult } from "@/types/jobFinder";

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
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-text">
            {filtered.length} Jobs Found
          </h3>
          {searchQuery && (
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">Matching: {searchQuery}</p>
          )}
        </div>

        {sources.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-text-muted shrink-0" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
              className="w-full sm:w-auto rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm sm:text-base text-text min-h-[44px] sm:min-h-0"
            >
              <option value="all">All Sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {filtered.map((job) => (
          <div
            key={job.id}
            className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 sm:mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm sm:text-base font-semibold text-text truncate">{job.title}</h4>
                <div className="flex items-center gap-1 text-xs sm:text-sm text-text-muted mt-0.5">
                  <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{job.company}</span>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-medium ${
                  job.source === "Adzuna"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-purple-50 text-purple-700"
                }`}
              >
                {job.source}
              </span>
            </div>

            {job.location && (
              <div className="mb-2 flex items-center gap-1 text-xs sm:text-sm text-text-muted">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                {job.location}
              </div>
            )}

            {(job.salary_min || job.salary_max) && (
              <div className="mb-2 flex items-center gap-1 text-xs sm:text-sm font-medium text-green-600">
                <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                {formatSalary(job.salary_min, job.salary_max, job.currency)}
              </div>
            )}

            {job.description && (
              <p className="mb-3 text-xs sm:text-sm text-text-muted line-clamp-3 leading-relaxed">{job.description}</p>
            )}

            {job.match_reason && (
              <div className="mb-3 flex items-start gap-1.5 sm:gap-2 rounded-lg bg-primary/5 px-3 py-2 sm:px-3.5 sm:py-2.5">
                <Sparkles className="mt-0.5 h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-primary" />
                <span className="text-xs sm:text-sm text-primary leading-relaxed">{job.match_reason}</span>
              </div>
            )}

            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition-colors hover:bg-primary/90 active:bg-primary/80 min-h-[44px] sm:min-h-0 w-full sm:w-auto"
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
