"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export type SalaryInsight = {
  job_title: string;
  location: string | null;
  experience_range: string;
  salary_range: { min: number; max: number; avg: number };
  currency: string;
  data_points: number;
  percentiles: { p25: number; p50: number; p75: number };
  trend: "rising" | "stable" | "declining";
  comparable_roles: Array<{ title: string; avg_salary: number }>;
};

export function useSalaryIntelligenceSearch() {
  return useMutation({
    mutationFn: (params: { title: string; location?: string; experience?: string }) => {
      const sp = new URLSearchParams({ title: params.title.trim() });
      if (params.location) sp.set("location", params.location);
      if (params.experience) sp.set("experience", params.experience);
      return apiFetch<SalaryInsight>(`/api/salary-intelligence?${sp.toString()}`);
    },
  });
}
