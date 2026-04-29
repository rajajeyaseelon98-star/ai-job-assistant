"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import type { HiringPrediction } from "@/lib/hiringPrediction";

export type HiringPredictionBody = {
  candidate_skills: string[];
  job_title: string;
  job_skills_required?: string[];
  match_score?: number;
  experience_years?: number;
  required_experience?: number;
};

export function useHiringPrediction() {
  return useMutation({
    mutationFn: (body: HiringPredictionBody) =>
      apiFetch<HiringPrediction>("/api/hiring-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}
