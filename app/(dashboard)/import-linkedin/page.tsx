"use client";

import { useState } from "react";
import { LinkedInImportForm } from "@/components/linkedin/LinkedInImportForm";
import { ImprovedResumeView } from "@/components/resume/ImprovedResumeView";
import type { ImprovedResumeContent } from "@/types/analysis";

export default function ImportLinkedInPage() {
  const [result, setResult] = useState<ImprovedResumeContent | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text">LinkedIn Import</h1>
        <p className="mt-1 text-text-muted">
          Import your LinkedIn profile to automatically generate a professional, ATS-optimized resume.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
        <LinkedInImportForm onResult={setResult} />
      </section>

      {result && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text">Generated Resume</h2>
          <ImprovedResumeView content={result} />
        </section>
      )}
    </div>
  );
}
