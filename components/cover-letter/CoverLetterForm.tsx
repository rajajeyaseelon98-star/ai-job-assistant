"use client";

import { useState, useEffect } from "react";
import { AIProgressIndicator } from "@/components/ui/AIProgressIndicator";
import { Loader2 } from "lucide-react";
import { useGenerateCoverLetter } from "@/hooks/mutations/use-generate-cover-letter";
import { InlineRetryCard } from "@/components/ui/InlineRetryCard";
import { ActionReceiptCard } from "@/components/ui/ActionReceiptCard";
import { toUiFeedback } from "@/lib/ui-feedback";

export interface CoverLetterGenerated {
  id: string;
  coverLetter: string;
  companyName: string | null;
  jobTitle: string | null;
  createdAt: string;
  jobDescription?: string;
  resumeText?: string;
}

interface CoverLetterFormProps {
  defaultResumeText?: string;
  defaultCompanyName?: string;
  defaultRole?: string;
  defaultJobDescription?: string;
  onGenerated: (data: CoverLetterGenerated) => void;
}

export function CoverLetterForm({
  defaultResumeText = "",
  defaultCompanyName = "",
  defaultRole = "",
  defaultJobDescription = "",
  onGenerated,
}: CoverLetterFormProps) {
  const [companyName, setCompanyName] = useState(defaultCompanyName);
  const [role, setRole] = useState(defaultRole);
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [resumeText, setResumeText] = useState(defaultResumeText);
  const [error, setError] = useState<ReturnType<typeof toUiFeedback> | null>(null);
  const [generatedMeta, setGeneratedMeta] = useState<{
    savedAt?: string;
    requestId?: string;
  } | null>(null);
  const generateMut = useGenerateCoverLetter();

  useEffect(() => {
    if (defaultCompanyName !== undefined) setCompanyName(defaultCompanyName);
    if (defaultRole !== undefined) setRole(defaultRole);
    if (defaultJobDescription !== undefined) setJobDescription(defaultJobDescription);
    if (defaultResumeText !== undefined) setResumeText(defaultResumeText);
  }, [defaultCompanyName, defaultRole, defaultJobDescription, defaultResumeText]);

  async function generateCoverLetter() {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError({
        message: "Resume text and job description are required.",
        retryable: false,
        isCreditsExhausted: false,
      });
      return;
    }
    setError(null);
    setGeneratedMeta(null);
    try {
      const data = await generateMut.mutateAsync({
        resumeText: resumeText.trim(),
        jobDescription: jobDescription.trim(),
        companyName: companyName.trim() || undefined,
        role: role.trim() || undefined,
      });
      onGenerated({
        id: data.id,
        coverLetter: data.coverLetter ?? "",
        companyName: data.companyName ?? null,
        jobTitle: data.jobTitle ?? null,
        createdAt: data.createdAt ?? new Date().toISOString(),
      });
      setGeneratedMeta({
        savedAt: data.meta?.savedAt ?? data.createdAt,
        requestId: data.meta?.requestId,
      });
    } catch (e) {
      setError(toUiFeedback(e));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await generateCoverLetter();
  }

  const loading = generateMut.isPending;

  const sourceLabel = defaultResumeText?.trim()
    ? "Using pasted resume text"
    : "Using uploaded or improved resume";

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      <div className="mb-4 inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
        {sourceLabel}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Company name</label>
          <input
            type="text"
            className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Inc."
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Role</label>
          <input
            type="text"
            className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="React Developer"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Job description</label>
        <textarea
          className="resize-y min-h-[160px] mb-6 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description…"
        />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Your resume text</label>
        <textarea
          className="resize-y min-h-[160px] mb-6 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
          rows={6}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume…"
        />
      </div>
      {error ? (
        <InlineRetryCard
          message={error.message}
          onRetry={() => void generateCoverLetter()}
          alternateHref="/history?tab=cover-letters"
          alternateLabel="Open history"
          nextAction={error.nextAction}
        />
      ) : null}
      {generatedMeta ? (
        <div className="mb-4">
          <ActionReceiptCard
            title="Cover letter saved"
            description={`Your cover letter is ready${generatedMeta.savedAt ? ` (saved ${new Date(generatedMeta.savedAt).toLocaleString()})` : ""}.`}
            primaryHref="/history?tab=cover-letters"
            primaryLabel="Open history"
            secondaryHref="/usage"
            secondaryLabel="View AI usage"
          />
          {generatedMeta.requestId ? (
            <p className="mt-2 text-xs text-slate-500">Request ID: {generatedMeta.requestId}</p>
          ) : null}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25 rounded-xl px-8 py-3.5 font-medium transition-all w-full sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating cover letter…
          </>
        ) : (
          "Generate cover letter"
        )}
      </button>
      {loading && <AIProgressIndicator message="Generating your cover letter…" />}
    </form>
  );
}
