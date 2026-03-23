"use client";

import { useState } from "react";
import { JobFinderForm } from "@/components/job-finder/JobFinderForm";
import { SkillsOverview } from "@/components/job-finder/SkillsOverview";
import { JobResults } from "@/components/job-finder/JobResults";
import type { ExtractedSkills, JobResult } from "@/types/jobFinder";

interface SearchResult {
  skills: ExtractedSkills;
  jobs: JobResult[];
  search_query: string;
  total: number;
  id: string | null;
}

export default function JobFinderPage() {
  const [result, setResult] = useState<SearchResult | null>(null);

  return (
    <>
      <div className="mx-auto w-full max-w-3xl pt-8 pb-4 space-y-4 sm:space-y-6 md:space-y-8">
        <div>
          <h1 className="mb-2 flex items-center gap-3 font-display text-3xl font-bold tracking-tight text-slate-900">
            Auto Job Finder
          </h1>
          <p className="mb-8 text-base leading-relaxed text-slate-500">
            Upload your resume and we&apos;ll automatically find matching jobs based on your skills and experience.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Your Resume</h2>
          <JobFinderForm onResult={(data) => setResult(data as SearchResult)} />
        </section>

        {result && <SkillsOverview skills={result.skills} />}
      </div>

      {result && (
        <div className="mx-auto w-full max-w-5xl pb-12">
          <section>
            <JobResults jobs={result.jobs} searchQuery={result.search_query} />
          </section>
        </div>
      )}
    </>
  );
}
