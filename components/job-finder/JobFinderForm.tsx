"use client";

import { useState, useRef } from "react";
import { Upload, Search, MapPin, Loader2 } from "lucide-react";
import type { ExtractedSkills, JobResult } from "@/types/jobFinder";
import { useUploadResume } from "@/hooks/mutations/use-upload-resume";
import { useAutoJobsSearch } from "@/hooks/mutations/use-auto-jobs";

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
  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMut = useUploadResume();
  const autoJobsMut = useAutoJobsSearch();

  async function handleFileUpload(file: File) {
    if (!file) return;
    setError("");
    setStep("Parsing resume...");
    try {
      const data = await uploadMut.mutateAsync(file);
      if (data.parsed_text) {
        setResumeText(data.parsed_text);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file");
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

    setError("");
    setStep("Finding matching jobs...");

    try {
      const data = await autoJobsMut.mutateAsync({
        resumeText,
        location: location.trim() || undefined,
      });
      onResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setStep("");
    }
  }

  const loading = autoJobsMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {/* File upload */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Upload Resume (PDF/DOCX)</label>
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
          disabled={uploadMut.isPending}
          className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 transition-all hover:border-indigo-500 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploadMut.isPending ? "Parsing…" : "Choose file or drag & drop"}
        </button>
      </div>

      {/* Resume text */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Or paste your resume text
        </label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={6}
          placeholder="Paste your full resume text here..."
          className="w-full min-h-[120px] resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
        />
        {resumeText && (
          <p className="mt-2 text-xs text-slate-500">
            {resumeText.length} characters
          </p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Preferred Location (optional)
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, Remote, New York..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
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
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 font-medium text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
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
