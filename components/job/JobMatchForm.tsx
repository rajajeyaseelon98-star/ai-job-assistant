"use client";

import { useState, useEffect } from "react";
import { AIProgressIndicator } from "@/components/ui/AIProgressIndicator";
import { useJobMatch } from "@/hooks/mutations/use-job-match";

interface JobMatchFormProps {
  defaultResumeText?: string;
  defaultJobTitle?: string;
  defaultJobDescription?: string;
  onResult: (
    data: {
      match_score: number;
      matched_skills: string[];
      missing_skills: string[];
      resume_improvements: string[];
    },
    context: { jobTitle: string; jobDescription: string; resumeText: string }
  ) => void;
}

export function JobMatchForm({
  defaultResumeText = "",
  defaultJobTitle = "",
  defaultJobDescription = "",
  onResult,
}: JobMatchFormProps) {
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [resumeText, setResumeText] = useState(defaultResumeText);
  const [error, setError] = useState<string | null>(null);
  const jobMatchMut = useJobMatch();

  useEffect(() => {
    if (defaultJobTitle !== undefined) setJobTitle(defaultJobTitle);
    if (defaultJobDescription !== undefined) setJobDescription(defaultJobDescription);
    if (defaultResumeText !== undefined) setResumeText(defaultResumeText);
  }, [defaultJobTitle, defaultJobDescription, defaultResumeText]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Paste both resume text and job description.");
      return;
    }
    setError(null);
    try {
      const data = await jobMatchMut.mutateAsync({
        resumeText: resumeText.trim(),
        jobDescription: jobDescription.trim(),
        jobTitle: jobTitle.trim() || undefined,
      });
      onResult(data, {
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        resumeText: resumeText.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
    }
  }

  const loading = jobMatchMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Resume text</label>
        <textarea
          className="w-full min-h-[160px] resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          rows={6}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text…"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Job title (optional)</label>
        <input
          type="text"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. React Developer"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Job description</label>
        <textarea
          className="w-full min-h-[160px] resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description…"
        />
      </div>
      {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 font-medium text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Matching…" : "Match resume"}
      </button>
      {loading && <AIProgressIndicator message="Matching your resume to the job…" />}
    </form>
  );
}
