"use client";

import { useState, useCallback } from "react";

const ALLOWED = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface ResumeUploadProps {
  onUploadComplete: (data: { id: string; parsed_text: string | null }) => void;
}

export function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload-resume", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploadComplete({ id: data.id, parsed_text: data.parsed_text });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Upload failed";
      setError(
        raw.includes("couldn’t read") || raw.includes("couldn't read")
          ? raw
          : raw === "Failed to extract text from file" || raw.includes("extract")
            ? "We couldn’t read this file. Try DOCX, another PDF, or paste your resume text."
            : raw
      );
    } finally {
      setLoading(false);
    }
  }, [onUploadComplete]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (!file.type.match(/^(application\/pdf|application\/vnd\.openxmlformats)/)) {
        setError("Only PDF and DOCX are allowed");
        return;
      }
      upload(file);
    },
    [upload]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
      e.target.value = "";
    },
    [upload]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed px-4 py-8 sm:px-5 sm:py-10 md:px-6 md:py-12 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-gray-200 bg-card"
        }`}
      >
        <input
          type="file"
          accept={ALLOWED}
          onChange={onFileInput}
          className="hidden"
          id="resume-upload"
          disabled={loading}
        />
        <label htmlFor="resume-upload" className="cursor-pointer block min-h-[44px] flex flex-col items-center justify-center gap-2">
          {/* Upload icon */}
          <svg
            className="h-8 w-8 sm:h-10 sm:w-10 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
          </svg>
          <div>
            <p className="text-sm sm:text-base md:text-lg font-medium text-text">
              {loading ? "Uploading..." : "Drag & drop your resume here"}
            </p>
            <p className="mt-1 text-xs sm:text-sm text-text-muted">or tap to browse -- PDF or DOCX</p>
          </div>
        </label>
      </div>
      {loading && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs sm:text-sm text-text-muted">Processing your resume...</span>
        </div>
      )}
      {error && <p className="text-xs sm:text-sm text-red-600 px-1">{error}</p>}
    </div>
  );
}
