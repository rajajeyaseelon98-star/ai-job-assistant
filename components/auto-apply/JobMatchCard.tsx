"use client";

import { MapPin, DollarSign, ExternalLink, TrendingUp, Lightbulb, Building2, Globe } from "lucide-react";
import type { AutoApplyJobResult } from "@/types/autoApply";

interface JobMatchCardProps {
  job: AutoApplyJobResult;
  onToggleSelect: (jobId: string) => void;
}

function applyChannel(job: AutoApplyJobResult): "platform" | "external" {
  if (job.apply_channel) return job.apply_channel;
  return job.url && job.source !== "Internal" ? "external" : "platform";
}

export function JobMatchCard({ job, onToggleSelect }: JobMatchCardProps) {
  const prob = job.interview_probability;
  const channel = applyChannel(job);
  const scorePill =
    job.match_score >= 80
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-sm font-bold"
      : job.match_score >= 60
        ? "bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-sm font-bold"
        : "bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-sm font-bold";
  const interviewFill = !prob
    ? "bg-border"
    : prob.level === "HIGH"
      ? "bg-emerald-500"
      : prob.level === "MEDIUM"
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className={`relative rounded-2xl border bg-card p-6 shadow-sm transition-all ${
      job.selected ? "border-primary ring-1 ring-primary/25 bg-surface-muted/60" : "border-border"
    } ${job.applied ? "opacity-60" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display truncate text-xl font-bold text-text">{job.title}</h3>
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center text-text-muted hover:text-primary sm:min-h-0 sm:min-w-0"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <p className="text-sm text-text-muted">{job.company}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${
                channel === "platform"
                  ? "border-emerald-100/50 bg-emerald-50 text-emerald-700"
                  : "border-border bg-surface-muted text-text-muted"
              }`}
              title={
                channel === "platform"
                  ? "Apply through our platform"
                  : "Opens external job board / company site"
              }
            >
              {channel === "platform" ? (
                <>
                  <Building2 className="h-3 w-3" /> Direct apply (our platform)
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3" /> External apply
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-muted">
              Source: {job.source}
            </span>
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {job.location}
              </span>
            )}
            {(job.salary_min || job.salary_max) && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {job.salary_min ? `${(job.salary_min / 1000).toFixed(0)}k` : ""}
                {job.salary_min && job.salary_max ? " - " : ""}
                {job.salary_max ? `${(job.salary_max / 1000).toFixed(0)}k` : ""}
              </span>
            )}
          </div>

          {job.match_reason && (
            <p className="mt-2 text-xs text-text-muted">{job.match_reason}</p>
          )}
        </div>

        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
          {/* Match Score */}
          <div className={scorePill}>
            {job.match_score}
          </div>

          {/* Interview Probability Badge */}
          {prob && (
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              prob.level === "HIGH"
                ? "bg-green-100 text-green-700"
                : prob.level === "MEDIUM"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}>
              <TrendingUp className="h-2.5 w-2.5" />
              {prob.level}
            </div>
          )}

          {!job.applied && (
            <label className="flex min-h-[44px] cursor-pointer items-center gap-1.5 sm:min-h-0">
              <input
                type="checkbox"
                checked={job.selected}
                onChange={() => onToggleSelect(job.job_id)}
                className="h-5 w-5 cursor-pointer rounded border-border text-primary transition-all focus:ring-primary"
              />
              <span className="text-xs text-text-muted">Apply</span>
            </label>
          )}
          {job.applied && (
            <span className="text-xs font-medium text-green-600">Applied</span>
          )}
        </div>
      </div>

      {/* Interview Probability Details */}
      {prob && (
        <div className="mt-4 rounded-xl border border-border bg-surface-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
            <span className="flex items-center gap-1 text-sm font-semibold text-text">
              <TrendingUp className="h-3 w-3" /> Interview Chance: {prob.score}%
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              prob.level === "HIGH" ? "bg-green-500 text-white"
              : prob.level === "MEDIUM" ? "bg-yellow-500 text-white"
              : "bg-red-400 text-white"
            }`}>
              {prob.level}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-card">
            <div
              className={`h-1.5 rounded-full transition-all ${interviewFill}`}
              style={{ width: `${prob.score}%` }}
            />
          </div>

          {/* Reasons */}
          {prob.reasons.length > 0 && (
            <ul className="space-y-0.5 mb-1.5">
              {prob.reasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="text-[11px] text-text-muted flex items-start gap-1">
                  <span className="text-green-500 mt-0.5">+</span> {reason}
                </li>
              ))}
            </ul>
          )}

          {/* Boost Tips */}
          {prob.boost_tips.length > 0 && (
            <div className="border-t border-border pt-1.5 mt-1.5">
              {prob.boost_tips.slice(0, 2).map((tip, i) => (
                <p key={i} className="text-[11px] text-amber-600 flex items-start gap-1">
                  <Lightbulb className="h-3 w-3 mt-0.5 shrink-0" /> {tip}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {job.cover_letter && (
        <details className="mt-4 rounded-xl border border-border bg-surface-muted p-4">
          <summary className="cursor-pointer text-xs font-medium text-primary">View cover letter snippet</summary>
          <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{job.cover_letter}</p>
        </details>
      )}
    </div>
  );
}
