"use client";

import { useState, useEffect } from "react";
import { AIProgressIndicator } from "@/components/ui/AIProgressIndicator";
import { useJobMatch } from "@/hooks/mutations/use-job-match";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

interface JobMatchFormProps {
  defaultResumeText?: string;
  defaultJobTitle?: string;
  defaultJobDescription?: string;
  onResult: (
    data: {
      match_score: number;
      matched_skills: string[];
      missing_skills: string[];
      resume_improvements: string[];
    },
    context: { jobTitle: string; jobDescription: string; resumeText: string }
  ) => void;
}

export function JobMatchForm({
  defaultResumeText = "",
  defaultJobTitle = "",
  defaultJobDescription = "",
  onResult,
}: JobMatchFormProps) {
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [resumeText, setResumeText] = useState(defaultResumeText);
  const [error, setError] = useState<string | null>(null);
  const jobMatchMut = useJobMatch();

  useEffect(() => {
    if (defaultJobTitle !== undefined) setJobTitle(defaultJobTitle);
    if (defaultJobDescription !== undefined) setJobDescription(defaultJobDescription);
    if (defaultResumeText !== undefined) setResumeText(defaultResumeText);
  }, [defaultJobTitle, defaultJobDescription, defaultResumeText]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Paste both resume text and job description.");
      return;
    }
    setError(null);
    try {
      const data = await jobMatchMut.mutateAsync({
        resumeText: resumeText.trim(),
        jobDescription: jobDescription.trim(),
        jobTitle: jobTitle.trim() || undefined,
      });
      onResult(data, {
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim(),
        resumeText: resumeText.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Match failed");
    }
  }

  const loading = jobMatchMut.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <div>
        <Label className="mb-2">Resume text</Label>
        <Textarea
          className="min-h-[160px] rounded-xl"
          rows={6}
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="Paste your resume text…"
        />
      </div>
      <div>
        <Label className="mb-2">Job title (optional)</Label>
        <Input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. React Developer"
        />
      </div>
      <div>
        <Label className="mb-2">Job description</Label>
        <Textarea
          className="min-h-[160px] rounded-xl"
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description…"
        />
      </div>
      {error && <p className="text-xs sm:text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={loading} className="mt-4 w-full sm:w-auto">
        {loading ? "Matching…" : "Match resume"}
      </Button>
      {loading && <AIProgressIndicator message="Matching your resume to the job…" />}
    </form>
  );
}
