"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { FeedbackButtons } from "@/components/ui/FeedbackButtons";
import { ShareScoreButton } from "@/components/ui/ShareScoreButton";

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
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
        <h3 className="text-xs sm:text-sm font-medium text-text-muted">Job Match Score</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-text">{match_score}</span>
          <span className="text-sm sm:text-base text-text-muted">%</span>
        </div>
        <ProgressBar value={match_score} className="mt-3 w-full" />
        <div className="mt-3 flex items-center gap-3">
          <ShareScoreButton score={match_score} type="match" />
        </div>
      </div>
      {matched_skills?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
          <h3 className="text-sm sm:text-base md:text-lg font-medium text-text">Matched skills</h3>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
            {matched_skills.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-green-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {missing_skills?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
          <h3 className="text-sm sm:text-base md:text-lg font-medium text-text">Missing skills</h3>
          <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
            {missing_skills.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-red-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {resume_improvements?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
          <h3 className="text-sm sm:text-base md:text-lg font-medium text-text">Resume improvements</h3>
          <ul className="mt-2 space-y-1.5 sm:space-y-2 list-inside list-disc text-xs sm:text-sm leading-relaxed text-text-muted">
            {resume_improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback */}
      <div className="rounded-xl border border-gray-200 bg-card px-4 py-3 sm:px-5 shadow-sm">
        <FeedbackButtons feature="job_match" />
      </div>
    </div>
  );
}
