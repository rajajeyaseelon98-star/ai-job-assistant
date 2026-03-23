"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Wand2, Loader2, Briefcase } from "lucide-react";
import type { ImprovedResumeContent } from "@/types/analysis";
import { humanizeImproveResumeError, humanizeNetworkError } from "@/lib/friendlyApiError";

interface TailorResumeFormProps {
  onResult: (content: ImprovedResumeContent, improvedResumeId?: string) => void;
}

export function TailorResumeForm({ onResult }: TailorResumeFormProps) {
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tailorFromJobMatch");
      if (!raw) return;
      const d = JSON.parse(raw) as {
        jobTitle?: string;
        jobDescription?: string;
        resumeText?: string;
      };
      if (d.resumeText) setResumeText(d.resumeText);
      if (d.jobTitle) setJobTitle(d.jobTitle);
      if (d.jobDescription) setJobDescription(d.jobDescription);
      sessionStorage.removeItem("tailorFromJobMatch");
    } catch {
      /* ignore */
    }
  }, []);

  async function handleFileUpload(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Max 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setError("");
      setStep("Parsing resume...");
      const res = await fetch("/api/upload-resume", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || "Upload failed";
        setError(
          msg.includes("couldn’t") || msg.includes("couldn't") || msg.includes("copy-paste")
            ? msg
            : "We couldn’t read this file. Try DOCX or paste your resume text below."
        );
        return;
      }
      const data = await res.json();
      if (data.parsed_text) {
        setResumeText(data.parsed_text);
      }
    } catch {
      setError(humanizeNetworkError());
    } finally {
      setStep("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim()) {
      setError("Please provide your resume text");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please provide the job description");
      return;
    }

    setLoading(true);
    setError("");
    setStep("Tailoring your resume for this role...");

    try {
      const res = await fetch("/api/improve-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobTitle: jobTitle.trim() || undefined,
          jobDescription: jobDescription.trim(),
          tailorIntent: "target_job",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(humanizeImproveResumeError(typeof data.error === "string" ? data.error : undefined));
        return;
      }

      const data = await res.json();
      const { improvedResumeId, ...content } = data;
      onResult(content as ImprovedResumeContent, improvedResumeId);
    } catch {
      setError(humanizeNetworkError());
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Resume Input */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-sm font-bold text-indigo-600">1</span>
          <h3 className="font-display text-xl font-semibold text-slate-900">
          Your Resume
          </h3>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f);
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50"
        >
          <Upload className="h-4 w-4" />
          Upload PDF/DOCX
        </button>
        <p className="mb-3 text-xs text-slate-500">
          If a PDF won’t parse, export as DOCX or paste your text — both work.
        </p>

        <label className="mb-2 block text-sm font-semibold text-slate-700">Resume Text</label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={5}
          placeholder="Or paste your full resume text here..."
          className="w-full min-h-[160px] resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {/* Job Details */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-sm font-bold text-indigo-600">2</span>
          <h3 className="font-display text-xl font-semibold text-slate-900">
          Target Job
          </h3>
        </div>

        <div className="mb-3 sm:mb-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Job Title</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Frontend Developer"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            placeholder="Paste the full job description here. The more detail, the better the tailoring..."
            className="w-full min-h-[160px] resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {step && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          {step}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !resumeText.trim() || !jobDescription.trim()}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Tailoring Resume...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            Tailor My Resume
          </>
        )}
      </button>
    </form>
  );
}
