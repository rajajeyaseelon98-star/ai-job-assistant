"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Wand2, Loader2, Briefcase } from "lucide-react";
import type { ImprovedResumeContent } from "@/types/analysis";
import { humanizeNetworkError } from "@/lib/friendlyApiError";
import { useUploadResume } from "@/hooks/mutations/use-upload-resume";
import { useImproveResume } from "@/hooks/mutations/use-improve-resume";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";

interface TailorResumeFormProps {
  onResult: (content: ImprovedResumeContent, improvedResumeId?: string) => void;
}

export function TailorResumeForm({ onResult }: TailorResumeFormProps) {
  const [resumeText, setResumeText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadMut = useUploadResume();
  const improveMut = useImproveResume();

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
    setError("");
    setStep("Parsing resume...");
    try {
      const data = await uploadMut.mutateAsync(file);
      if (data.parsed_text) {
        setResumeText(data.parsed_text);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
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

    setError("");
    setStep("Tailoring your resume for this role...");

    try {
      const data = await improveMut.mutateAsync({
        resumeText,
        jobTitle: jobTitle.trim() || undefined,
        jobDescription: jobDescription.trim(),
        tailorIntent: "target_job",
      });
      const { improvedResumeId, ...content } = data;
      onResult(content as ImprovedResumeContent, improvedResumeId);
    } catch (e) {
      setError(e instanceof Error ? e.message : humanizeNetworkError());
    } finally {
      setStep("");
    }
  }

  const loading = improveMut.isPending;
  const parsing = uploadMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <Card className="mb-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-surface-muted text-sm font-bold text-primary">
            1
          </span>
          <h3 className="font-display text-xl font-semibold text-text">Your Resume</h3>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFileUpload(f);
          }}
        />
        <Button type="button" onClick={() => fileRef.current?.click()} disabled={parsing} variant="secondary">
          <Upload className="h-4 w-4" />
          Upload PDF/DOCX
        </Button>
        <p className="mb-3 text-xs text-text-muted">
          If a PDF won’t parse, export as DOCX or paste your text — both work.
        </p>

        <Label className="mb-2">Resume Text</Label>
        <Textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={5}
          placeholder="Or paste your full resume text here..."
          className="min-h-[160px] rounded-xl"
        />
      </Card>

      <Card className="mb-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-surface-muted text-sm font-bold text-primary">
            2
          </span>
          <h3 className="font-display text-xl font-semibold text-text">Target Job</h3>
        </div>

        <div className="mb-3 sm:mb-4">
          <Label className="mb-2">Job Title</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Frontend Developer"
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <Label className="mb-2">
            Job Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            placeholder="Paste the full job description here. The more detail, the better the tailoring..."
            className="min-h-[160px] rounded-xl"
          />
        </div>
      </Card>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {step && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          {step}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !resumeText.trim() || !jobDescription.trim() || parsing}
        className="mt-2 w-full sm:w-auto"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        {loading ? "Tailoring Resume..." : "Tailor My Resume"}
      </Button>
    </form>
  );
}
