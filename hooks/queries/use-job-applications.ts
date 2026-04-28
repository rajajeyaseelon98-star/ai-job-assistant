"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export type RecruiterJobApplicationRow = Record<string, unknown> & {
  id: string;
  stage: string;
  created_at: string;
  updated_at: string;
  job?: { id: string; title: string; company_id?: string | null } | null;
  company?: { id: string; name?: string | null; website?: string | null } | null;
  events?: Array<Record<string, unknown>>;
};

export function useMyJobApplications(limit = 50) {
  return useQuery({
    queryKey: ["job-applications", limit] as const,
    queryFn: async () => {
      const data = await apiFetch<{ rows: RecruiterJobApplicationRow[] }>(
        `/api/job-applications?limit=${encodeURIComponent(String(limit))}`
      );
      return data.rows || [];
    },
    staleTime: 30 * 1000,
  });
}

