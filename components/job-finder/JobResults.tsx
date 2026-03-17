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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text">
            {filtered.length} Jobs Found
          </h3>
          {searchQuery && (
            <p className="text-sm text-text-muted">Matching: {searchQuery}</p>
          )}
        </div>

        {sources.length > 1 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
              className="rounded-lg border border-gray-300 bg-background px-2 py-1 text-sm text-text"
            >
              <option value="all">All Sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((job) => (
          <div
            key={job.id}
            className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-text truncate">{job.title}</h4>
                <div className="flex items-center gap-1 text-sm text-text-muted">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{job.company}</span>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  job.source === "Adzuna"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-purple-50 text-purple-700"
                }`}
              >
                {job.source}
              </span>
            </div>

            {job.location && (
              <div className="mb-2 flex items-center gap-1 text-xs text-text-muted">
                <MapPin className="h-3 w-3 shrink-0" />
                {job.location}
              </div>
            )}

            {(job.salary_min || job.salary_max) && (
              <div className="mb-2 flex items-center gap-1 text-xs font-medium text-green-600">
                <DollarSign className="h-3 w-3 shrink-0" />
                {formatSalary(job.salary_min, job.salary_max, job.currency)}
              </div>
            )}

            {job.description && (
              <p className="mb-3 text-xs text-text-muted line-clamp-3">{job.description}</p>
            )}

            {job.match_reason && (
              <div className="mb-3 flex items-start gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                <span className="text-xs text-primary">{job.match_reason}</span>
              </div>
            )}

            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
              >
                <ExternalLink className="h-3 w-3" />
                Apply Now
              </a>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-text-muted py-8">
          No jobs found for the selected filter.
        </p>
      )}
    </div>
  );
}
