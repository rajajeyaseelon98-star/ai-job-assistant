"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

interface ResumePerformanceData {
  resume_id: string;
  version_label: string | null;
  target_role: string | null;
  total_applications: number;
  total_interviews: number;
  total_offers: number;
  total_rejections: number;
  interview_rate: number;
  offer_rate: number;
  avg_match_score: number;
  best_for_roles: string[];
}

interface HiringBenchmark {
  percentile: number;
  total_candidates: number;
  your_score: number;
  avg_score: number;
  top_factor: string;
}

interface ApplySuccessIntelligence {
  resume_versions: ResumePerformanceData[];
  best_resume_id: string | null;
  best_resume_label: string | null;
  best_interview_rate: number;
  insights: string[];
  score_threshold_insight: string | null;
  optimal_daily_apply_count: number;
  role_recommendations: Array<{ role: string; interview_rate: number }>;
}

interface ResumePerformanceResponse {
  performance: ApplySuccessIntelligence;
  benchmark: HiringBenchmark;
}

export const resumePerformanceKeys = {
  all: ["resume-performance"] as const,
  detail: () => [...resumePerformanceKeys.all, "detail"] as const,
};

export function useResumePerformance() {
  return useQuery({
    queryKey: resumePerformanceKeys.detail(),
    queryFn: () => apiFetch<ResumePerformanceResponse>("/api/resume-performance"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useShareBenchmark() {
  return useMutation({
    mutationFn: (payload: { type: string; data: Record<string, unknown> }) =>
      apiFetch<{ url: string }>("/api/share-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
  });
}
