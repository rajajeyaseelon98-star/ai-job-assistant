"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export const activityKeys = {
  all: ["activity"] as const,
  feed: (isPublic: boolean) => [...activityKeys.all, isPublic ? "public" : "my"] as const,
  stats: () => [...activityKeys.all, "stats"] as const,
};

interface ActivityFeedResponse {
  items: unknown[];
}

interface PlatformStats {
  total_users: number;
  total_applications: number;
  total_interviews: number;
  total_hires: number;
  total_resumes_improved: number;
  avg_match_score: number;
}

export function useActivityFeed(isPublic: boolean) {
  const url = isPublic ? "/api/activity-feed?public=true" : "/api/activity-feed";
  return useQuery({
    queryKey: activityKeys.feed(isPublic),
    queryFn: () => apiFetch<ActivityFeedResponse>(url),
    staleTime: 30 * 1000,
  });
}

export function usePlatformStats() {
  return useQuery({
    queryKey: activityKeys.stats(),
    queryFn: () => apiFetch<PlatformStats>("/api/platform-stats"),
    staleTime: 5 * 60 * 1000,
  });
}
