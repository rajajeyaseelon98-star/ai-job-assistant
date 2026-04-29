"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImprovedResumeContent } from "@/types/analysis";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { apiFetchJsonWithHumanizer } from "@/lib/api-fetcher";
import { humanizeImproveResumeError } from "@/lib/friendlyApiError";
import { dashboardKeys } from "@/hooks/queries/use-dashboard";

export type ImproveResumeInput = {
  resumeText: string;
  resumeId?: string;
  jobTitle?: string;
  jobDescription?: string;
  tailorIntent?: "target_job" | "optimize_current";
  previousAnalysis?: {
    atsScore?: number;
    missingSkills?: string[];
    resumeImprovements?: string[];
  };
};

export type ImproveResumeResult = ImprovedResumeContent & {
  improvedResumeId?: string;
};

async function postImproveResume(input: ImproveResumeInput): Promise<ImproveResumeResult> {
  const data = await apiFetchJsonWithHumanizer<Record<string, unknown>>(
    "/api/improve-resume",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: input.resumeText,
        resumeId: input.resumeId,
        jobTitle: input.jobTitle,
        jobDescription: input.jobDescription,
        tailorIntent: input.tailorIntent,
        previousAnalysis: input.previousAnalysis,
      }),
    },
    humanizeImproveResumeError
  );
  const { improvedResumeId, ...rest } = data;
  return {
    ...(rest as unknown as ImprovedResumeContent),
    improvedResumeId: typeof improvedResumeId === "string" ? improvedResumeId : undefined,
  };
}

export function useImproveResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postImproveResume,
    onSuccess: () => {
      dispatchUsageUpdated();
      void qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
      void qc.invalidateQueries({ queryKey: dashboardKeys.history() });
    },
  });
}
