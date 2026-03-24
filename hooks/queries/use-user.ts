"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export interface UserData {
  id: string;
  email: string;
  name: string | null;
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
