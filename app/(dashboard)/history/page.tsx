"use client";

import { useHistory } from "@/hooks/queries/use-dashboard";
import { HistoryResumeSection } from "./HistoryResumeSection";
import { HistoryJobMatchSection } from "./HistoryJobMatchSection";
import { HistoryCoverLetterSection } from "./HistoryCoverLetterSection";
import { HistoryImprovedResumeSection } from "./HistoryImprovedResumeSection";
import { PageLoading } from "@/components/ui/PageLoading";

export default function HistoryPage() {
  const { data, isLoading, error } = useHistory();

  if (isLoading) return <PageLoading titleWidth="w-32" />;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto w-full py-8">
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">History</h1>
        <p className="mt-4 text-sm text-red-600">Failed to load history. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-4 sm:space-y-6 md:space-y-8">
      <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">History</h1>
      <p className="text-slate-500 text-sm mt-2">
        Your resume analyses, job matches, improved resumes, and cover letters.
      </p>

      <HistoryResumeSection items={data?.analyses ?? []} />
      <HistoryJobMatchSection items={data?.matches ?? []} />
      <HistoryImprovedResumeSection items={data?.improvedResumes ?? []} />
      <HistoryCoverLetterSection items={data?.coverLetters ?? []} />
    </div>
  );
}
