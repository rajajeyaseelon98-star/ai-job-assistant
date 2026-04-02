"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import { useCoverLetterById } from "@/hooks/queries/use-jobseeker-persisted";
import { SectionSkeleton } from "@/components/ui/SectionSkeleton";
import type { CoverLetterGenerated } from "@/components/cover-letter/CoverLetterForm";

const CoverLetterForm = lazy(() =>
  import("@/components/cover-letter/CoverLetterForm").then((m) => ({ default: m.CoverLetterForm }))
);
const CoverLetterResult = lazy(() =>
  import("@/components/cover-letter/CoverLetterResult").then((m) => ({ default: m.CoverLetterResult }))
);

function CoverLetterContent() {
  const [generated, setGenerated] = useState<CoverLetterGenerated | null>(null);
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");

  const { data: savedLetter } = useCoverLetterById(idFromUrl);

  useEffect(() => {
    if (!savedLetter) return;
    setGenerated({
      id: savedLetter.id as string,
      coverLetter: savedLetter.content as string,
      companyName: savedLetter.company_name as string,
      jobTitle: savedLetter.job_title as string,
      createdAt: savedLetter.created_at as string,
      jobDescription: (savedLetter.job_description as string) ?? "",
      resumeText: (savedLetter.resume_text as string) ?? "",
    });
  }, [savedLetter]);

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
        <Suspense fallback={<SectionSkeleton height="h-48" />}>
          <CoverLetterForm
            defaultCompanyName={generated?.companyName ?? ""}
            defaultRole={generated?.jobTitle ?? ""}
            defaultJobDescription={generated?.jobDescription ?? ""}
            defaultResumeText={generated?.resumeText ?? ""}
            onGenerated={setGenerated}
          />
        </Suspense>
      </section>

      {generated && (
        <section className="mt-12 pt-12 border-t border-slate-200">
          <Suspense fallback={<SectionSkeleton height="h-48" />}>
            <CoverLetterResult
              id={generated.id}
              text={generated.coverLetter}
              onSaved={(newContent) => setGenerated((p) => p ? { ...p, coverLetter: newContent } : null)}
            />
          </Suspense>
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
