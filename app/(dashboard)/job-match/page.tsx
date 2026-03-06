"use client";

import { useState } from "react";
import { JobMatchForm } from "@/components/job/JobMatchForm";
import { MatchResult } from "@/components/job/MatchResult";

export default function JobMatchPage() {
  const [result, setResult] = useState<{
    match_score: number;
    missing_skills: string[];
    recommended_keywords: string[];
  } | null>(null);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Job Match</h1>
      <p className="text-text-muted">
        Paste your resume and a job description to see how well you match and which keywords to add.
      </p>

      <section className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text">Paste job description</h2>
        <JobMatchForm onResult={setResult} />
      </section>

      {result && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text">Match result</h2>
          <MatchResult
            match_score={result.match_score}
            missing_skills={result.missing_skills}
            recommended_keywords={result.recommended_keywords}
          />
        </section>
      )}
    </div>
  );
}
