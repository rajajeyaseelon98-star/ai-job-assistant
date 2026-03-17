"use client";

import { useState, useRef } from "react";
import { Upload, Linkedin, Loader2, FileText } from "lucide-react";
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
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-blue-800">How to get your LinkedIn data</h3>
        <ol className="space-y-1 text-sm text-blue-700">
          <li><strong>Option 1:</strong> Go to your LinkedIn profile, select all text (Ctrl+A), and copy-paste it below.</li>
          <li><strong>Option 2:</strong> On LinkedIn, click &quot;More&quot; on your profile, then &quot;Save to PDF&quot;. Upload the PDF here.</li>
          <li><strong>Option 3:</strong> Go to LinkedIn Settings &rarr; Data Privacy &rarr; Get a copy of your data. Upload the exported file.</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File upload for LinkedIn PDF */}
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Upload LinkedIn PDF</label>
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
            className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-text-muted hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Upload LinkedIn PDF export</span>
            <FileText className="h-4 w-4 ml-1" />
          </button>
        </div>

        {/* Text paste */}
        <div>
          <label className="mb-1 block text-sm font-medium text-text">
            Or paste your LinkedIn profile text
          </label>
          <textarea
            value={profileText}
            onChange={(e) => setProfileText(e.target.value)}
            rows={8}
            placeholder={"Copy everything from your LinkedIn profile page and paste here...\n\nInclude: headline, about, experience, education, skills, certifications, projects, etc."}
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
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
  );
}
