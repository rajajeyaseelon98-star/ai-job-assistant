"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { JobMatchForm } from "@/components/job/JobMatchForm";
import { MatchResult } from "@/components/job/MatchResult";

type MatchResultData = {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  resume_improvements: string[];
};

function JobMatchContent() {
  const searchParams = useSearchParams();
  const matchId = searchParams.get("matchId");
  const [result, setResult] = useState<MatchResultData | null>(null);
  const [pastLoading, setPastLoading] = useState(!!matchId);
  const [formDefaults, setFormDefaults] = useState<{
    jobTitle: string;
    jobDescription: string;
    resumeText: string;
  }>({ jobTitle: "", jobDescription: "", resumeText: "" });

  useEffect(() => {
    if (!matchId) return;
    setPastLoading(true);
    fetch(`/api/job-matches/${matchId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.analysis) {
          const a = data.analysis;
          setResult({
            match_score: a.match_score ?? 0,
            matched_skills: a.matched_skills ?? [],
            missing_skills: a.missing_skills ?? [],
            resume_improvements: a.resume_improvements ?? [],
          });
        }
        if (data) {
          setFormDefaults({
            jobTitle: data.job_title ?? "",
            jobDescription: data.job_description ?? "",
            resumeText: data.resume_text ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setPastLoading(false));
  }, [matchId]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Job Match</h1>
      <p className="text-sm sm:text-base text-text-muted">
        Paste your resume and a job description to see how well you match and which keywords to add.
      </p>
      {matchId && result && (
        <p className="text-sm text-text-muted">Viewing past match from history.</p>
      )}
      {pastLoading && <p className="text-sm text-text-muted">Loading past match…</p>}

      <section className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm">
        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Paste job description</h2>
        <JobMatchForm
          defaultResumeText={formDefaults.resumeText}
          defaultJobTitle={formDefaults.jobTitle}
          defaultJobDescription={formDefaults.jobDescription}
          onResult={setResult}
        />
      </section>

      {result && (
        <section>
          <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Match result</h2>
          <MatchResult
            match_score={result.match_score}
            matched_skills={result.matched_skills ?? []}
            missing_skills={result.missing_skills}
            resume_improvements={result.resume_improvements ?? []}
          />
        </section>
      )}
    </div>
  );
}

export default function JobMatchPage() {
  return (
    <Suspense fallback={<div className="space-y-4 sm:space-y-6"><h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Job Match</h1><p className="text-text-muted">Loading…</p></div>}>
      <JobMatchContent />
    </Suspense>
  );
}
