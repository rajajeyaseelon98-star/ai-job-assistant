"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: "job_seeker" | "recruiter";
  last_active_role?: "job_seeker" | "recruiter";
  recruiter_onboarding_complete?: boolean;
  plan_type: "free" | "pro" | "premium";
  preferences: {
    experience_level: string | null;
    preferred_role: string | null;
    preferred_location: string | null;
    salary_expectation: string | null;
  };
}

export const userKeys = {
  all: ["user"] as const,
  me: () => [...userKeys.all, "me"] as const,
};

export function useUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => apiFetch<UserData>("/api/user"),
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ ok?: boolean }>("/api/user/delete-account", { method: "POST" }),
  });
}
