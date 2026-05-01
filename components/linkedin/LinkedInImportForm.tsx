"use client";

import { useState, useRef } from "react";
import { Upload, Linkedin, Loader2, FileText, Info } from "lucide-react";
import type { ImprovedResumeContent } from "@/types/analysis";
import { useUploadResume } from "@/hooks/mutations/use-upload-resume";
import { useImportLinkedIn } from "@/hooks/mutations/use-import-linkedin";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";

interface LinkedInImportFormProps {
  onResult: (content: ImprovedResumeContent) => void;
}

export function LinkedInImportForm({ onResult }: LinkedInImportFormProps) {
  const [profileText, setProfileText] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMut = useUploadResume();
  const importMut = useImportLinkedIn();

  async function handleFileUpload(file: File) {
    if (!file) return;
    setError("");
    setStep("Parsing LinkedIn PDF...");
    try {
      const data = await uploadMut.mutateAsync(file);
      if (data.parsed_text) {
        setProfileText(data.parsed_text);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file");
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

    setError("");
    setStep("Creating resume from LinkedIn profile...");

    try {
      const data = await importMut.mutateAsync(profileText.trim());
      onResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setStep("");
    }
  }

  const loading = importMut.isPending;
  const parsing = uploadMut.isPending;

  return (
    <div>
      <Card className="mb-10 bg-surface-muted/60">
        <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-text">
          <Info className="h-4 w-4 text-primary" />
          How to get your data
        </h3>
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <span className="mt-1 shrink-0 rounded border border-primary/15 bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              Option 1
            </span>
            <p className="text-sm leading-relaxed text-text-muted">
              Go to your LinkedIn profile, select all text (Ctrl+A), and copy-paste it below.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="mt-1 shrink-0 rounded border border-primary/15 bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              Option 2
            </span>
            <p className="text-sm leading-relaxed text-text-muted">
              On LinkedIn, click &quot;More&quot; on your profile, then &quot;Save to PDF&quot;. Upload the PDF here.
            </p>
          </div>
          <div className="flex gap-3 items-start">
            <span className="mt-1 shrink-0 rounded border border-primary/15 bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
              Option 3
            </span>
            <p className="text-sm leading-relaxed text-text-muted">
              Go to LinkedIn Settings &rarr; Data Privacy &rarr; Get a copy of your data. Upload the exported file.
            </p>
          </div>
        </div>
      </Card>

      <Card className="mb-8 p-6 sm:p-10">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <Label className="mb-3">Upload LinkedIn PDF</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFileUpload(f);
              }}
            />
            <Button type="button" onClick={() => fileRef.current?.click()} disabled={parsing} variant="secondary" className="mb-8">
              <Upload className="h-4 w-4" />
              <span>{parsing ? "Parsing…" : "Upload LinkedIn PDF export"}</span>
              <FileText className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <div className="mb-3 block border-t border-border pt-4 text-sm font-semibold text-text">
              Or paste your LinkedIn profile text
            </div>
            <Textarea
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              rows={8}
              placeholder={
                "Copy everything from your LinkedIn profile page and paste here...\n\nInclude: headline, about, experience, education, skills, certifications, projects, etc."
              }
              className="min-h-[200px] rounded-xl"
            />
            {profileText ? (
              <p className="mt-1 text-xs text-text-muted">{profileText.length} characters</p>
            ) : null}
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          {step && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              {step}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !profileText.trim() || profileText.trim().length < 50 || parsing}
            className="w-full sm:w-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Linkedin className="h-4 w-4" />}
            {loading ? "Creating Resume..." : "Import & Create Resume"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
