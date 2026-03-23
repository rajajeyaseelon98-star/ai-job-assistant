"use client";

import { useState, useRef } from "react";
import { Upload, Linkedin, Loader2, FileText, Info } from "lucide-react";
import type { ImprovedResumeContent } from "@/types/analysis";

interface LinkedInImportFormProps {
  onResult: (content: ImprovedResumeContent) => void;
}

export function LinkedInImportForm({ onResult }: LinkedInImportFormProps) {
  const [profileText, setProfileText] = useState("");
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
      setStep("Parsing LinkedIn PDF...");
      const res = await fetch("/api/upload-resume", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Upload failed");
        return;
      }
      const data = await res.json();
      if (data.parsed_text) {
        setProfileText(data.parsed_text);
      }
    } catch {
      setError("Failed to parse file");
    } finally {
      setStep("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileText.trim() || profileText.trim().length < 50) {
      setError("Please provide your LinkedIn profile text (minimum 50 characters)");
      return;
    }

    setLoading(true);
    setError("");
    setStep("Creating resume from LinkedIn profile...");

    try {
      const res = await fetch("/api/import-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileText }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Import failed");
        return;
      }

      const data = await res.json();
      onResult(data as ImprovedResumeContent);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  return (
    <div>
      {/* Instruction box */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10">
        <h3 className="font-display text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-600" />
          How to get your data
        </h3>
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mt-1 shrink-0">
              Option 1
            </span>
            <p className="text-sm text-slate-600 leading-relaxed">
              Go to your LinkedIn profile, select all text (Ctrl+A), and copy-paste it below.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mt-1 shrink-0">
              Option 2
            </span>
            <p className="text-sm text-slate-600 leading-relaxed">
              On LinkedIn, click &quot;More&quot; on your profile, then &quot;Save to PDF&quot;. Upload the PDF here.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 mt-1 shrink-0">
              Option 3
            </span>
            <p className="text-sm text-slate-600 leading-relaxed">
              Go to LinkedIn Settings &rarr; Data Privacy &rarr; Get a copy of your data. Upload the exported file.
            </p>
          </div>
        </div>
      </div>

      {/* Action card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-10 mb-8">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* File upload for LinkedIn PDF */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-3 block">
              Upload LinkedIn PDF
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm rounded-xl px-4 py-2.5 text-sm font-medium transition-all inline-flex items-center gap-2 mb-8"
            >
              <Upload className="h-4 w-4" />
              <span>Upload LinkedIn PDF export</span>
              <FileText className="h-4 w-4" />
            </button>
          </div>

          {/* Text paste */}
          <div>
            <div className="text-sm font-semibold text-slate-700 mb-3 block pt-4 border-t border-slate-100">
              Or paste your LinkedIn profile text
            </div>
            <textarea
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              rows={8}
              placeholder={"Copy everything from your LinkedIn profile page and paste here...\n\nInclude: headline, about, experience, education, skills, certifications, projects, etc."}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none min-h-[200px]"
            />
            {profileText && (
              <p className="mt-1 text-xs text-text-muted">{profileText.length} characters</p>
            )}
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
            disabled={loading || !profileText.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-8 py-3.5 font-medium transition-all w-full sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Resume...
              </>
            ) : (
              <>
                <Linkedin className="h-4 w-4" />
                Import & Create Resume
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
