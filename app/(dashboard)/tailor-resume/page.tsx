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
    <div className="mx-auto w-full max-w-3xl space-y-4 py-8 sm:space-y-6 md:space-y-8">
      <div>
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-slate-900">Resume Tailoring</h1>
        <p className="mb-8 text-base leading-relaxed text-slate-500">
          <strong className="text-slate-900">Resume Tailoring</strong> rewrites your resume for a specific job (ATS-friendly sections).
          This is different from <strong className="text-slate-900">Job Match</strong>, which only scores fit and gaps.
        </p>
      </div>

      <TailorResumeForm
        onResult={(content, improvedResumeId) =>
          setResult({ content, improvedResumeId })
        }
      />

      {result && (
        <section className="mt-12 border-t border-slate-200 pt-12">
          <h2 className="mb-6 font-display text-2xl font-bold text-slate-900">Tailored Resume</h2>
          <ImprovedResumeView
            content={result.content}
            improvedResumeId={result.improvedResumeId}
          />
        </section>
      )}
    </div>
  );
}
