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
      setError(e instanceof Error ? e.message : "Upload failed");
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
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
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
        <label htmlFor="resume-upload" className="cursor-pointer">
          <p className="font-medium text-text">
            {loading ? "Uploading…" : "Drag & drop your resume here"}
          </p>
          <p className="mt-1 text-sm text-text-muted">or click to browse — PDF or DOCX</p>
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
