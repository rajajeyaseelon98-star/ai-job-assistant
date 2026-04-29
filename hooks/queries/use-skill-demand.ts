"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

interface SkillDemandInfo {
  skill: string;
  demand_count: number;
  supply_count: number;
  demand_supply_ratio: number;
  trend: number;
  avg_salary: number | null;
  top_roles: string[];
  status: "hot" | "growing" | "stable" | "declining" | "oversaturated";
}

interface SkillDemandDashboard {
  trending_skills: SkillDemandInfo[];
  declining_skills: SkillDemandInfo[];
  highest_paying: SkillDemandInfo[];
  most_in_demand: SkillDemandInfo[];
  your_skills_analysis: SkillDemandInfo[];
}

export const skillDemandKeys = {
  all: ["skill-demand"] as const,
  dashboard: () => [...skillDemandKeys.all, "dashboard"] as const,
};

export function useSkillDemand() {
  return useQuery({
    queryKey: skillDemandKeys.dashboard(),
    queryFn: () => apiFetch<SkillDemandDashboard>("/api/skill-demand"),
    staleTime: 5 * 60 * 1000,
  });
}
