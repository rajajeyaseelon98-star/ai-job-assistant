"use client";

import { useState } from "react";
import { LinkedInImportForm } from "@/components/linkedin/LinkedInImportForm";
import { ImprovedResumeView } from "@/components/resume/ImprovedResumeView";
import type { ImprovedResumeContent } from "@/types/analysis";

export default function ImportLinkedInPage() {
  const [result, setResult] = useState<ImprovedResumeContent | null>(null);

  return (
    <div className="max-w-3xl mx-auto w-full py-8 space-y-4 sm:space-y-6 md:space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">
          LinkedIn Import
        </h1>
        <p className="text-slate-500 text-base mb-8 leading-relaxed">
          Import your LinkedIn profile to automatically generate a professional, ATS-optimized resume.
        </p>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-8 flex items-center gap-3 shadow-sm text-sm text-amber-800 font-medium">
          <strong>Optional / Advanced.</strong> Most users should start with{" "}
          <a
            href="/resume-builder"
            className="text-indigo-600 underline underline-offset-4 hover:text-indigo-700 font-medium"
          >
            Quick Resume Builder
          </a>{" "}
          or{" "}
          <a
            href="/resume-analyzer"
            className="text-indigo-600 underline underline-offset-4 hover:text-indigo-700 font-medium"
          >
            Resume Analyzer
          </a>
          . Complete your profile in{" "}
          <a
            href="/settings"
            className="text-indigo-600 underline underline-offset-4 hover:text-indigo-700 font-medium"
          >
            Settings
          </a>{" "}
          anytime.
        </div>
      </div>

      <section>
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
