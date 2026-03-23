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
    <div className="max-w-3xl mx-auto w-full py-8 space-y-4 sm:space-y-6 md:space-y-8">
      <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">
        Cover Letter Generator
      </h1>
      <p className="text-slate-500 text-base mb-8 leading-relaxed">
        Enter company, role, job description, and your resume to generate a professional cover letter.
      </p>

      <section className="mb-10 rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-slate-900 mb-6">
          Generate cover letter
        </h2>
        <CoverLetterForm
          defaultCompanyName={generated?.companyName ?? ""}
          defaultRole={generated?.jobTitle ?? ""}
          defaultJobDescription={generated?.jobDescription ?? ""}
          defaultResumeText={generated?.resumeText ?? ""}
          onGenerated={setGenerated}
        />
      </section>

      {generated && (
        <section className="mt-12 pt-12 border-t border-slate-200">
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
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto w-full py-8 space-y-4 sm:space-y-6">
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Cover Letter Generator
          </h1>
          <p className="text-slate-500 text-base mb-8 leading-relaxed">Loading…</p>
        </div>
      }
    >
      <CoverLetterContent />
    </Suspense>
  );
}
