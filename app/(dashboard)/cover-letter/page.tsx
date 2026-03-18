"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CoverLetterForm } from "@/components/cover-letter/CoverLetterForm";
import { CoverLetterResult } from "@/components/cover-letter/CoverLetterResult";
import type { CoverLetterGenerated } from "@/components/cover-letter/CoverLetterForm";

function CoverLetterContent() {
  const [generated, setGenerated] = useState<CoverLetterGenerated | null>(null);
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");

  useEffect(() => {
    if (!idFromUrl) return;
    fetch(`/api/cover-letters/${idFromUrl}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data)
          setGenerated({
            id: data.id,
            coverLetter: data.content,
            companyName: data.company_name,
            jobTitle: data.job_title,
            createdAt: data.created_at,
            jobDescription: data.job_description ?? "",
            resumeText: data.resume_text ?? "",
          });
      })
      .catch(() => {});
  }, [idFromUrl]);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Cover Letter Generator</h1>
      <p className="text-sm sm:text-base text-text-muted">
        Enter company, role, job description, and your resume to generate a professional cover letter.
      </p>

      <section className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
        <h2 className="mb-4 text-lg sm:text-xl font-semibold text-text">Generate cover letter</h2>
        <CoverLetterForm
          defaultCompanyName={generated?.companyName ?? ""}
          defaultRole={generated?.jobTitle ?? ""}
          defaultJobDescription={generated?.jobDescription ?? ""}
          defaultResumeText={generated?.resumeText ?? ""}
          onGenerated={setGenerated}
        />
      </section>

      {generated && (
        <section>
          <h2 className="mb-4 text-lg sm:text-xl font-semibold text-text">Generated cover letter</h2>
          <CoverLetterResult
            id={generated.id}
            text={generated.coverLetter}
            onSaved={(newContent) => setGenerated((p) => p ? { ...p, coverLetter: newContent } : null)}
          />
        </section>
      )}
    </div>
  );
}

export default function CoverLetterPage() {
  return (
    <Suspense fallback={<div className="space-y-4 sm:space-y-6"><h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Cover Letter Generator</h1><p className="text-text-muted">Loading…</p></div>}>
      <CoverLetterContent />
    </Suspense>
  );
}
