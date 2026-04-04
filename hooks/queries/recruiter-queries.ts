"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { recruiterKeys } from "./recruiter-keys";

export function useRecruiterJobs() {
  return useQuery({
    queryKey: recruiterKeys.jobs(),
    queryFn: () => apiFetch<unknown[]>("/api/recruiter/jobs"),
    staleTime: 60 * 1000,
  });
}

export function useRecruiterJob(id: string) {
  return useQuery({
    queryKey: recruiterKeys.job(id),
    queryFn: () => apiFetch<Record<string, unknown>>(`/api/recruiter/jobs/${id}`),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useRecruiterApplications() {
  return useQuery({
    queryKey: recruiterKeys.applications(),
    queryFn: () => apiFetch<unknown[]>("/api/recruiter/applications"),
    staleTime: 30 * 1000,
  });
}

export { useMessages, useMessages as useRecruiterMessages } from "./use-messages";

export function useRecruiterAlerts() {
  return useQuery({
    queryKey: recruiterKeys.alerts(),
    queryFn: () => apiFetch<unknown[]>("/api/recruiter/alerts"),
    staleTime: 60 * 1000,
  });
}

export function useRecruiterTemplates() {
  return useQuery({
    queryKey: recruiterKeys.templates(),
    queryFn: () => apiFetch<unknown[]>("/api/recruiter/templates"),
    staleTime: 2 * 60 * 1000,
  });
}

/** First company row for the recruiter, or `null` (GET /api/recruiter/company returns an array). */
export function useRecruiterCompany() {
  return useQuery({
    queryKey: recruiterKeys.company(),
    queryFn: async () => {
      const rows = await apiFetch<Record<string, unknown>[]>("/api/recruiter/company");
      if (!Array.isArray(rows)) return null;
      return rows[0] ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecruiterTopCandidates(params?: string) {
  const url = params ? `/api/recruiter/top-candidates?${params}` : "/api/recruiter/top-candidates?limit=30";
  return useQuery({
    queryKey: recruiterKeys.topCandidates(params),
    queryFn: () => apiFetch<unknown[]>(url),
    staleTime: 30 * 1000,
  });
}

export function useRecruiterUser() {
  return useQuery({
    queryKey: recruiterKeys.user(),
    queryFn: () => apiFetch<Record<string, unknown>>("/api/user"),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: "always",
  });
}

export type RecruiterCandidatesListResponse = {
  candidates: Array<{
    id: string;
    email: string;
    name: string | null;
    resume_preview: string | null;
    has_resume?: boolean;
    experience_level: string | null;
    preferred_role: string | null;
    preferred_location: string | null;
    salary_expectation: string | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  truncated?: boolean;
};

export function useRecruiterCandidatesSearch(params: {
  page: number;
  pageSize: number;
  skills: string;
  experience: string;
  location: string;
}) {
  return useQuery({
    queryKey: [...recruiterKeys.all, "candidates-search", params] as const,
    queryFn: () => {
      const sp = new URLSearchParams();
      sp.set("page", String(params.page));
      sp.set("pageSize", String(params.pageSize));
      if (params.skills.trim()) sp.set("skills", params.skills.trim());
      if (params.experience) sp.set("experience", params.experience);
      if (params.location.trim()) sp.set("location", params.location.trim());
      return apiFetch<RecruiterCandidatesListResponse>(
        `/api/recruiter/candidates?${sp.toString()}`
      );
    },
    staleTime: 30 * 1000,
  });
}

export function useRecruiterCandidateDetail(id: string) {
  return useQuery({
    queryKey: recruiterKeys.candidateDetail(id),
    queryFn: () =>
      apiFetch<Record<string, unknown>>(`/api/recruiter/candidates/${id}`),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
