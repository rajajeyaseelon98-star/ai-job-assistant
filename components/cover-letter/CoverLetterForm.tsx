"use client";

import { useState, useEffect } from "react";

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-text">Company name</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Inc."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text">Role</label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="React Developer"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-text">Job description</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm text-text"
          rows={6}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description…"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text">Your resume text</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm text-text"
          rows={6}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume…"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? "Generating…" : "Generate cover letter"}
      </button>
    </form>
  );
}
