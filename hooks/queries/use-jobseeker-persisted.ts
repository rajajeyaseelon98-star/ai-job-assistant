"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

/** Keys for history / deep-linked job seeker entities (align with previous inline `useQuery` keys). */
export const jobSeekerPersistedKeys = {
  resumeAnalysis: (id: string) => ["resume-analysis", id] as const,
  improvedResume: (id: string) => ["improved-resume", id] as const,
  coverLetter: (id: string) => ["cover-letter", id] as const,
  jobMatch: (id: string) => ["job-match", id] as const,
};

export function useResumeAnalysisById(analysisId: string | null) {
  return useQuery({
    queryKey: jobSeekerPersistedKeys.resumeAnalysis(analysisId ?? ""),
    queryFn: () =>
      apiFetch<Record<string, unknown>>(`/api/resume-analysis/${analysisId}`),
    enabled: !!analysisId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useImprovedResumeById(improvedId: string | null) {
  return useQuery({
    queryKey: jobSeekerPersistedKeys.improvedResume(improvedId ?? ""),
    queryFn: () =>
      apiFetch<Record<string, unknown>>(`/api/improved-resumes/${improvedId}`),
    enabled: !!improvedId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCoverLetterById(id: string | null) {
  return useQuery({
    queryKey: jobSeekerPersistedKeys.coverLetter(id ?? ""),
    queryFn: () => apiFetch<Record<string, unknown>>(`/api/cover-letters/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useJobMatchById(matchId: string | null) {
  return useQuery({
    queryKey: jobSeekerPersistedKeys.jobMatch(matchId ?? ""),
    queryFn: () => apiFetch<Record<string, unknown>>(`/api/job-matches/${matchId}`),
    enabled: !!matchId,
    staleTime: 5 * 60 * 1000,
  });
}
