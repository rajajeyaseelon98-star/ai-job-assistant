"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";

interface MatchResultProps {
  match_score: number;
  missing_skills: string[];
  recommended_keywords: string[];
}

export function MatchResult({
  match_score,
  missing_skills,
  recommended_keywords,
}: MatchResultProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-text-muted">Match score</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-text">{match_score}</span>
          <span className="text-text-muted">%</span>
        </div>
        <ProgressBar value={match_score} className="mt-3" />
      </div>
      {missing_skills?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="font-medium text-text">Missing skills</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-text-muted">
            {missing_skills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {recommended_keywords?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="font-medium text-text">Recommended keywords</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {recommended_keywords.map((k, i) => (
              <span
                key={i}
                className="rounded-md bg-primary/10 px-2 py-1 text-sm text-primary"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
