"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";

interface MatchResultProps {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  resume_improvements: string[];
}

export function MatchResult({
  match_score,
  matched_skills,
  missing_skills,
  resume_improvements,
}: MatchResultProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-text-muted">Job Match Score</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-text">{match_score}</span>
          <span className="text-text-muted">%</span>
        </div>
        <ProgressBar value={match_score} className="mt-3" />
      </div>
      {matched_skills?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="font-medium text-text">Matched skills</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-text-muted">
            {matched_skills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
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
      {resume_improvements?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="font-medium text-text">Resume improvements</h3>
          <ul className="mt-2 list-inside list-disc text-sm text-text-muted">
            {resume_improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
