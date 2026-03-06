"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import type { AnalysisResult } from "@/types/resume";

interface ResumeAnalysisResultProps {
  data: AnalysisResult;
}

export function ResumeAnalysisResult({ data }: ResumeAnalysisResultProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
        <h3 className="text-sm font-medium text-text-muted">ATS Score</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-text">{data.score}</span>
          <span className="text-text-muted">/ 100</span>
        </div>
        <ProgressBar value={data.score} className="mt-3" />
      </div>

      {data.strengths?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="font-medium text-text">Strengths</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-text-muted">
            {data.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {data.weaknesses?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="font-medium text-text">Weaknesses</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-text-muted">
            {data.weaknesses.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {data.missing_keywords?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="font-medium text-text">Missing keywords</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.missing_keywords.map((k, i) => (
              <span
                key={i}
                className="rounded-md bg-amber-100 px-2 py-1 text-sm text-amber-800"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.suggestions?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="font-medium text-text">Suggestions</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-text-muted">
            {data.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
