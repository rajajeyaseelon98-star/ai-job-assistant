"use client";

import { useState, useEffect } from "react";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { AIProgressIndicator } from "@/components/ui/AIProgressIndicator";

interface JobMatchFormProps {
  defaultResumeText?: string;
  defaultJobTitle?: string;
  defaultJobDescription?: string;
  onResult: (data: {
    match_score: number;
    matched_skills: string[];
    missing_skills: string[];
    resume_improvements: string[];
  }) => void;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setLoading(true);
    try {
      const res = await fetch("/api/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim(),
          jobTitle: jobTitle.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Match failed");
      onResult(data);
      dispatchUsageUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text">Resume text</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm text-text"
          rows={6}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text…"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text">Job title (optional)</label>
        <input
          type="text"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. React Developer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text">Job description</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm text-text"
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description…"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? "Matching…" : "Match resume"}
      </button>
      {loading && <AIProgressIndicator message="Matching your resume to the job…" />}
    </form>
  );
}
