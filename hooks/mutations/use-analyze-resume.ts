"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ATSAnalysisResult } from "@/types/resume";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { apiFetchJsonWithHumanizer } from "@/lib/api-fetcher";
import { humanizeImproveResumeError } from "@/lib/friendlyApiError";
import { dashboardKeys } from "@/hooks/queries/use-dashboard";

export type AnalyzeResumeInput = {
  resumeText: string;
  resumeId?: string;
  recheckAfterImprovement?: boolean;
  previousAnalysis?: {
    atsScore?: number;
    missingSkills?: string[];
    resumeImprovements?: string[];
  };
};

export type AnalyzeResumeResult = ATSAnalysisResult & {
  _usage?: { used: number; limit: number };
};

async function postAnalyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeResult> {
  return apiFetchJsonWithHumanizer<AnalyzeResumeResult>(
    "/api/analyze-resume",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: input.resumeText,
        resumeId: input.resumeId,
        recheckAfterImprovement: input.recheckAfterImprovement,
        previousAnalysis: input.previousAnalysis,
      }),
    },
    humanizeImproveResumeError
  );
}

export function useAnalyzeResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postAnalyzeResume,
    onSuccess: () => {
      dispatchUsageUpdated();
      void qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
      void qc.invalidateQueries({ queryKey: dashboardKeys.history() });
    },
  });
}
