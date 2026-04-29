"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

interface CareerDiagnosis {
  status: "thriving" | "improving" | "struggling" | "critical" | "new";
  headline: string;
  problems: Array<{ issue: string; severity: string; fix: string }>;
  career_direction: Array<{ role: string; reason: string; match_level: string }>;
  skill_roi: Array<{ skill: string; roi_score: number; reason: string; action: string }>;
  weekly_summary: {
    period: string;
    applications_sent: number;
    interviews_earned: number;
    offers_received: number;
    interview_rate_change: number;
    best_action: string;
    worst_action: string;
    recommendation: string;
  } | null;
  score_explanation: {
    ats_breakdown: Record<string, number> | null;
    interview_probability_breakdown: Record<string, number> | null;
    rank_breakdown: Record<string, number> | null;
  };
}

export const careerCoachKeys = {
  all: ["career-coach"] as const,
  detail: () => [...careerCoachKeys.all, "detail"] as const,
};

export function useCareerCoach() {
  return useQuery({
    queryKey: careerCoachKeys.detail(),
    queryFn: () => apiFetch<CareerDiagnosis>("/api/career-coach"),
    staleTime: 5 * 60 * 1000,
  });
}
