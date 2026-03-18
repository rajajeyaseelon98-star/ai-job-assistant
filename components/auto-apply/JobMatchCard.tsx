"use client";

import { MapPin, DollarSign, ExternalLink, TrendingUp, Lightbulb } from "lucide-react";
import type { AutoApplyJobResult } from "@/types/autoApply";

interface JobMatchCardProps {
  job: AutoApplyJobResult;
  onToggleSelect: (jobId: string) => void;
}

export function JobMatchCard({ job, onToggleSelect }: JobMatchCardProps) {
  const prob = job.interview_probability;

  return (
    <div className={`rounded-xl border p-3 sm:p-4 transition-colors ${
      job.selected ? "border-primary bg-primary/5" : "border-gray-200 bg-card"
    } ${job.applied ? "opacity-60" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold text-text truncate">{job.title}</h3>
            {job.url && (
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-text-muted hover:text-primary active:text-primary/70 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <p className="text-xs sm:text-sm text-text-muted">{job.company}</p>

          <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-text-muted">
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
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{job.source}</span>
          </div>

          {job.match_reason && (
            <p className="mt-2 text-xs text-text-muted">{job.match_reason}</p>
          )}
        </div>

        <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
          {/* Match Score */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
            job.match_score >= 80 ? "bg-green-500" : job.match_score >= 60 ? "bg-yellow-500" : "bg-red-400"
          }`}>
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
            <label className="flex items-center gap-1.5 cursor-pointer min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={job.selected}
                onChange={() => onToggleSelect(job.job_id)}
                className="h-5 w-5 sm:h-4 sm:w-4 rounded border-gray-300 text-primary focus:ring-primary"
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
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-2 sm:p-3">
          <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
            <span className="text-xs font-semibold text-text flex items-center gap-1">
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
          <div className="h-1.5 w-full rounded-full bg-gray-200 mb-2">
            <div
              className={`h-1.5 rounded-full transition-all ${
                prob.level === "HIGH" ? "bg-green-500"
                : prob.level === "MEDIUM" ? "bg-yellow-500"
                : "bg-red-400"
              }`}
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
            <div className="border-t border-gray-200 pt-1.5 mt-1.5">
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
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-primary">View cover letter snippet</summary>
          <p className="mt-1.5 text-xs text-text-muted leading-relaxed">{job.cover_letter}</p>
        </details>
      )}
    </div>
  );
}
