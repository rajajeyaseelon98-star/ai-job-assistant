"use client";

import { useState, useRef } from "react";
import { Upload, Search, MapPin, Loader2 } from "lucide-react";
import type { ExtractedSkills, JobResult } from "@/types/jobFinder";

interface JobFinderFormProps {
  onResult: (result: {
    skills: ExtractedSkills;
    jobs: JobResult[];
    search_query: string;
    total: number;
    id: string | null;
  }) => void;
}

export function JobFinderForm({ onResult }: JobFinderFormProps) {
  const [resumeText, setResumeText] = useState("");
  const [location, setLocation] = useState("");
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
    if (!resumeText.trim() || resumeText.trim().length < 50) {
      setError("Please provide your resume text (minimum 50 characters)");
      return;
    }

    setLoading(true);
    setError("");
    setStep("Extracting skills from resume...");

    try {
      const res = await fetch("/api/auto-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, location: location.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Search failed");
        return;
      }

      setStep("Finding matching jobs...");
      const data = await res.json();
      onResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File upload */}
      <div>
        <label className="mb-1 block text-sm font-medium text-text">Upload Resume (PDF/DOCX)</label>
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
          className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-text-muted hover:border-primary hover:text-primary transition-colors"
        >
          <Upload className="h-4 w-4" />
          Choose file or drag & drop
        </button>
      </div>

      {/* Resume text */}
      <div>
        <label className="mb-1 block text-sm font-medium text-text">
          Or paste your resume text
        </label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={6}
          placeholder="Paste your full resume text here..."
          className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {resumeText && (
          <p className="mt-1 text-xs text-text-muted">
            {resumeText.length} characters
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="mb-1 block text-sm font-medium text-text">
          Preferred Location (optional)
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, Remote, New York..."
            className="w-full rounded-lg border border-gray-300 bg-background py-2 pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
        disabled={loading || !resumeText.trim()}
        className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Finding Jobs...
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            Find Matching Jobs
          </>
        )}
      </button>
    </form>
  );
}
