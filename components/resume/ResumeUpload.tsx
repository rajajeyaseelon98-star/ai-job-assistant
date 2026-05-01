"use client";

import { useState, useCallback } from "react";
import { useUploadResume } from "@/hooks/mutations/use-upload-resume";

const ALLOWED = "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface ResumeUploadProps {
  onUploadComplete: (data: { id: string; parsed_text: string | null }) => void;
}

export function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadMut = useUploadResume();

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const data = await uploadMut.mutateAsync(file);
        onUploadComplete({ id: data.id, parsed_text: data.parsed_text });
      } catch (e) {
        const raw = e instanceof Error ? e.message : "Upload failed";
        setError(raw);
      }
    },
    [uploadMut, onUploadComplete]
  );

  const loading = uploadMut.isPending;

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
      void upload(file);
    },
    [upload]
  );

  const onFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void upload(file);
      e.target.value = "";
    },
    [upload]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center shadow-card transition-all ${
          dragging ? "border-primary bg-surface-muted/60" : "border-border bg-card hover:border-primary/35 hover:bg-surface-muted/60"
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
        <label htmlFor="resume-upload" className="block min-h-[44px] cursor-pointer">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted transition-colors group-hover:bg-primary/10">
            <svg
              className="h-8 w-8 text-text-muted transition-colors group-hover:text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
              />
            </svg>
          </div>
          <div>
            <p className="mb-1 text-lg font-medium text-text">
              {loading ? "Uploading..." : "Drag & drop your resume here"}
            </p>
            <p className="text-sm text-text-muted">or tap to browse -- PDF or DOCX</p>
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
