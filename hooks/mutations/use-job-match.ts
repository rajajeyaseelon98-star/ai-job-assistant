"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { apiFetchJsonWithHumanizer } from "@/lib/api-fetcher";
import { humanizeImproveResumeError } from "@/lib/friendlyApiError";
import { dashboardKeys } from "@/hooks/queries/use-dashboard";

export type JobMatchInput = {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  resumeId?: string;
};

export type JobMatchApiResult = {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  resume_improvements: string[];
};

async function postJobMatch(input: JobMatchInput): Promise<JobMatchApiResult> {
  return apiFetchJsonWithHumanizer<JobMatchApiResult>(
    "/api/job-match",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: input.resumeText,
        jobDescription: input.jobDescription,
        jobTitle: input.jobTitle,
        resumeId: input.resumeId,
      }),
    },
    humanizeImproveResumeError
  );
}

export function useJobMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postJobMatch,
    onSuccess: () => {
      dispatchUsageUpdated();
      void qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
      void qc.invalidateQueries({ queryKey: dashboardKeys.history() });
    },
  });
}
