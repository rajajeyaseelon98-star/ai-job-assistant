"use client";

import { useState, useEffect } from "react";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { AIProgressIndicator } from "@/components/ui/AIProgressIndicator";
import { Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultCompanyName !== undefined) setCompanyName(defaultCompanyName);
    if (defaultRole !== undefined) setRole(defaultRole);
    if (defaultJobDescription !== undefined) setJobDescription(defaultJobDescription);
    if (defaultResumeText !== undefined) setResumeText(defaultResumeText);
  }, [defaultCompanyName, defaultRole, defaultJobDescription, defaultResumeText]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Resume text and job description are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim(),
          companyName: companyName.trim() || undefined,
          role: role.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      onGenerated({
        id: data.id,
        coverLetter: data.coverLetter ?? "",
        companyName: data.companyName ?? null,
        jobTitle: data.jobTitle ?? null,
        createdAt: data.createdAt ?? new Date().toISOString(),
      });
      dispatchUsageUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
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
      {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
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
