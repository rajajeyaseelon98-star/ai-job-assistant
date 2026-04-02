"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import type { RecruiterIntelligence } from "@/lib/recruiterIntelligence";

export const recruiterIntelligenceKeys = {
  all: () => ["recruiter", "intelligence"] as const,
};

export function useRecruiterIntelligence() {
  return useQuery({
    queryKey: recruiterIntelligenceKeys.all(),
    queryFn: () => apiFetch<RecruiterIntelligence>("/api/recruiter/intelligence"),
    staleTime: 60 * 1000,
  });
}
