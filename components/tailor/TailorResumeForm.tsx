"use client";

import { useState, useRef } from "react";
import { Upload, Wand2, Loader2, Briefcase } from "lucide-react";
import type { ImprovedResumeContent } from "@/types/analysis";

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
        setError(data.error || "Upload failed");
        return;
      }
      const data = await res.json();
      if (data.parsed_text) {
        setResumeText(data.parsed_text);
      }
    } catch {
      setError("Failed to parse file");
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
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Tailoring failed");
        return;
      }

      const data = await res.json();
      const { improvedResumeId, ...content } = data;
      onResult(content as ImprovedResumeContent, improvedResumeId);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Resume Input */}
      <div className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-text">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
          Your Resume
        </h3>

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
          className="mb-3 flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-text-muted hover:border-primary hover:text-primary transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload PDF/DOCX
        </button>

        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={5}
          placeholder="Or paste your full resume text here..."
          className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Job Details */}
      <div className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-text">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
          Target Job
        </h3>

        <div className="mb-3">
          <label className="mb-1 block text-sm font-medium text-text">Job Title</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Frontend Developer"
              className="w-full rounded-lg border border-gray-300 bg-background py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            placeholder="Paste the full job description here. The more detail, the better the tailoring..."
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
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
