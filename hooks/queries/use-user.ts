"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { recruiterKeys } from "./recruiter-keys";

export interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: "job_seeker" | "recruiter";
  last_active_role?: "job_seeker" | "recruiter";
  recruiter_onboarding_complete?: boolean;
  plan_type: "free" | "pro" | "premium";
  headline?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  profile_strength?: number | null;
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

function patchUserCaches(
  qc: ReturnType<typeof useQueryClient>,
  patch: Partial<Pick<UserData, "avatar_url" | "profile_strength">>
) {
  const updater = (old: UserData | undefined) =>
    old ? { ...old, ...patch } : old;
  qc.setQueryData<UserData>(userKeys.me(), updater);
  qc.setQueryData<UserData>(recruiterKeys.user(), updater);
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.set("file", file);
      return apiFetch<{ avatar_url: string; profile_strength: number }>("/api/user/avatar", {
        method: "POST",
        body: form,
      });
    },
    onSuccess: (data) => {
      patchUserCaches(qc, {
        avatar_url: data.avatar_url,
        profile_strength: data.profile_strength,
      });
      void qc.invalidateQueries({ queryKey: userKeys.me() });
      void qc.invalidateQueries({ queryKey: recruiterKeys.user() });
    },
  });
}

export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ ok?: boolean; avatar_url: null; profile_strength: number }>("/api/user/avatar", {
        method: "DELETE",
      }),
    onSuccess: (data) => {
      patchUserCaches(qc, {
        avatar_url: null,
        profile_strength: data.profile_strength,
      });
      void qc.invalidateQueries({ queryKey: userKeys.me() });
      void qc.invalidateQueries({ queryKey: recruiterKeys.user() });
    },
  });
}
