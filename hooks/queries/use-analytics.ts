"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

interface Insights {
  total_applications: number;
  total_interviews: number;
  total_offers: number;
  total_rejections: number;
  interview_rate: number;
  offer_rate: number;
  avg_response_days: number | null;
  best_performing_skills: string[];
  worst_performing_roles: string[];
  recommendations: string[];
  weight_adjustments: {
    skill_weight: number;
    experience_weight: number;
    quality_weight: number;
  };
}

interface Funnel {
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
  pending: number;
}

interface InsightsResponse {
  insights: Insights;
  funnel: Funnel;
}

export const analyticsKeys = {
  all: ["analytics"] as const,
  insights: () => [...analyticsKeys.all, "insights"] as const,
};

export function useInsights() {
  return useQuery({
    queryKey: analyticsKeys.insights(),
    queryFn: () => apiFetch<InsightsResponse>("/api/insights"),
    staleTime: 2 * 60 * 1000,
  });
}
