"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export interface AiUsageSummaryResponse {
  totalTokens: number;
  totalCredits: number;
  totalCostUsd: number;
  totalCostInr: number;
  mostUsedFeature: string | null;
  totalCreditsAvailable: number;
  usedCredits: number;
  remainingCredits: number;
}

export interface AiUsageHistoryRow {
  id: string;
  feature_name: string;
  total_tokens: number;
  credits_used: number;
  cost_usd: number | null;
  cost_inr: number | null;
  cache_hit: boolean;
  model_used: string | null;
  provider: string | null;
  created_at: string;
}

export interface AiFeatureBreakdownRow {
  feature_name: string;
  calls: number;
  total_tokens: number;
  total_credits: number;
  total_cost_usd: number;
  total_cost_inr: number;
}

export const aiUsageKeys = {
  all: ["ai-usage"] as const,
  summary: () => [...aiUsageKeys.all, "summary"] as const,
  history: (limit: number) => [...aiUsageKeys.all, "history", limit] as const,
  featureBreakdown: () => [...aiUsageKeys.all, "feature-breakdown"] as const,
};

export function useAiUsageSummary() {
  return useQuery({
    queryKey: aiUsageKeys.summary(),
    queryFn: () => apiFetch<AiUsageSummaryResponse>("/api/usage/summary"),
    staleTime: 60 * 1000,
  });
}

export function useAiUsageHistory(limit = 50) {
  return useQuery({
    queryKey: aiUsageKeys.history(limit),
    queryFn: () => apiFetch<{ rows: AiUsageHistoryRow[] }>(`/api/usage/history?limit=${limit}`),
    staleTime: 60 * 1000,
  });
}

export function useAiFeatureBreakdown() {
  return useQuery({
    queryKey: aiUsageKeys.featureBreakdown(),
    queryFn: () => apiFetch<{ rows: AiFeatureBreakdownRow[] }>("/api/usage/feature-breakdown"),
    staleTime: 60 * 1000,
  });
}

