"use client";

import { useState } from "react";
import { LinkedInImportForm } from "@/components/linkedin/LinkedInImportForm";
import { ImprovedResumeView } from "@/components/resume/ImprovedResumeView";
import type { ImprovedResumeContent } from "@/types/analysis";

export default function ImportLinkedInPage() {
  const [result, setResult] = useState<ImprovedResumeContent | null>(null);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">LinkedIn Import</h1>
        <p className="mt-1 text-xs sm:text-sm text-text-muted">
          Import your LinkedIn profile to automatically generate a professional, ATS-optimized resume.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-6 shadow-sm">
        <LinkedInImportForm onResult={setResult} />
      </section>

      {result && (
        <section>
          <h2 className="mb-4 text-base sm:text-lg font-semibold text-text">Generated Resume</h2>
          <ImprovedResumeView content={result} />
        </section>
      )}
    </div>
  );
}
