"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { apiFetchJsonWithHumanizer } from "@/lib/api-fetcher";
import { humanizeCoverLetterError } from "@/lib/friendlyApiError";
import { dashboardKeys } from "@/hooks/queries/use-dashboard";

export type GenerateCoverLetterInput = {
  /** When set, server loads parsed_text for this resume (preferred over resumeText). */
  resumeId?: string;
  /** When set, server flattens structured improved resume JSON (preferred over resumeText). */
  improvedResumeId?: string;
  resumeText?: string;
  jobDescription: string;
  companyName?: string;
  role?: string;
};

export type GenerateCoverLetterResult = {
  id: string;
  coverLetter: string;
  companyName: string | null;
  jobTitle: string | null;
  createdAt: string;
};

async function postGenerateCoverLetter(
  input: GenerateCoverLetterInput
): Promise<GenerateCoverLetterResult> {
  const d = await apiFetchJsonWithHumanizer<Record<string, unknown>>(
    "/api/generate-cover-letter",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeId: input.resumeId,
        improvedResumeId: input.improvedResumeId,
        resumeText: input.resumeText,
        jobDescription: input.jobDescription,
        companyName: input.companyName,
        role: input.role,
      }),
    },
    humanizeCoverLetterError
  );
  return {
    id: String(d.id ?? ""),
    coverLetter: String(d.coverLetter ?? ""),
    companyName: (d.companyName as string | null | undefined) ?? null,
    jobTitle: (d.jobTitle as string | null | undefined) ?? null,
    createdAt: String(d.createdAt ?? new Date().toISOString()),
  };
}

export function useGenerateCoverLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postGenerateCoverLetter,
    onSuccess: () => {
      dispatchUsageUpdated();
      void qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
      void qc.invalidateQueries({ queryKey: dashboardKeys.history() });
    },
  });
}
