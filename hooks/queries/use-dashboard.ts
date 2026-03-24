"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  history: () => [...dashboardKeys.all, "history"] as const,
  settings: () => [...dashboardKeys.all, "settings"] as const,
};

interface DashboardStats {
  analyses: Array<{ id: string; score: number; created_at: string }>;
  matches: Array<{ id: string; match_score: number; job_title: string; created_at: string }>;
  coverLetters: Array<{ id: string; company_name: string; created_at: string }>;
  applicationCount: number;
  avgMatchScore: number | null;
  usage: Record<string, { used: number; limit: number }>;
  userName: string | null;
  planType: string;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => apiFetch<DashboardStats>("/api/dashboard"),
    staleTime: 30 * 1000,
  });
}

interface HistoryData {
  analyses: Array<{ id: string; score: number; created_at: string }>;
  matches: Array<{ id: string; match_score: number; job_title: string; created_at: string }>;
  coverLetters: Array<{ id: string; company_name: string; job_title: string; created_at: string }>;
  improvedResumes: Array<{ id: string; job_title: string; created_at: string }>;
}

export function useHistory() {
  return useQuery({
    queryKey: dashboardKeys.history(),
    queryFn: () => apiFetch<HistoryData>("/api/history"),
    staleTime: 30 * 1000,
  });
}
