"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ExtractedSkills, JobResult } from "@/types/jobFinder";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { apiFetchJsonWithHumanizer } from "@/lib/api-fetcher";
import { humanizeImproveResumeError } from "@/lib/friendlyApiError";
import { dashboardKeys } from "@/hooks/queries/use-dashboard";

export type AutoJobsResult = {
  skills: ExtractedSkills;
  jobs: JobResult[];
  search_query: string;
  total: number;
  id: string | null;
};

async function postAutoJobs(input: {
  resumeText: string;
  location?: string;
}): Promise<AutoJobsResult> {
  return apiFetchJsonWithHumanizer<AutoJobsResult>(
    "/api/auto-jobs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: input.resumeText,
        location: input.location,
      }),
    },
    humanizeImproveResumeError
  );
}

export function useAutoJobsSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postAutoJobs,
    onSuccess: () => {
      dispatchUsageUpdated();
      void qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
      void qc.invalidateQueries({ queryKey: dashboardKeys.history() });
    },
  });
}
