"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetchJsonWithHumanizer } from "@/lib/api-fetcher";
import type { InterviewPrepResponse } from "@/types/analysis";
import { humanizeImproveResumeError } from "@/lib/friendlyApiError";

export function useInterviewPrep() {
  return useMutation({
    mutationFn: (body: { role: string; experienceLevel?: string }) =>
      apiFetchJsonWithHumanizer<InterviewPrepResponse>(
        "/api/interview-prep",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        humanizeImproveResumeError
      ),
  });
}
