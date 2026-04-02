"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import type { InterviewPrepResponse } from "@/types/analysis";

export function useInterviewPrep() {
  return useMutation({
    mutationFn: (body: { role: string; experienceLevel?: string }) =>
      apiFetch<InterviewPrepResponse>("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}
