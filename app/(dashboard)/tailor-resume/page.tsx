"use client";

import { useState } from "react";
import { TailorResumeForm } from "@/components/tailor/TailorResumeForm";
import { ImprovedResumeView } from "@/components/resume/ImprovedResumeView";
import type { ImprovedResumeContent } from "@/types/analysis";

export default function TailorResumePage() {
  const [result, setResult] = useState<{
    content: ImprovedResumeContent;
    improvedResumeId?: string;
  } | null>(null);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Resume Tailoring</h1>
        <p className="mt-1 text-sm sm:text-base text-text-muted">
          Paste a job description and your resume — we&apos;ll rewrite it to match the role perfectly, optimized for ATS.
        </p>
      </div>

      <TailorResumeForm
        onResult={(content, improvedResumeId) =>
          setResult({ content, improvedResumeId })
        }
      />

      {result && (
        <section>
          <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Tailored Resume</h2>
          <ImprovedResumeView
            content={result.content}
            improvedResumeId={result.improvedResumeId}
          />
        </section>
      )}
    </div>
  );
}
