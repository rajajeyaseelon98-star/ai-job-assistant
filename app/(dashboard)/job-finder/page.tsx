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
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Auto Job Finder</h1>
        <p className="mt-1 text-sm sm:text-base text-text-muted">
          Upload your resume and we&apos;ll automatically find matching jobs based on your skills and experience.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm">
        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Your Resume</h2>
        <JobFinderForm onResult={(data) => setResult(data as SearchResult)} />
      </section>

      {result && (
        <>
          <SkillsOverview skills={result.skills} />

          <section>
            <JobResults jobs={result.jobs} searchQuery={result.search_query} />
          </section>
        </>
      )}
    </div>
  );
}
