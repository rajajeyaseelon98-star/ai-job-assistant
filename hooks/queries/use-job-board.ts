"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { sharedQueryKeys } from "@/hooks/queries/shared-query-keys";

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  location: string | null;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  skills_required: string[] | null;
  experience_min: number | null;
  experience_max: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  location: string | null;
  work_type: string | null;
  employment_type: string | null;
  application_count: number | null;
  created_at: string;
  companies: Company | null;
}

interface JobsResponse {
  jobs: Job[];
  total: number;
  totalPages: number;
}

interface Resume {
  id: string;
  file_name: string;
}

interface JobsFilters {
  search: string;
  location: string;
  workType: string;
  employmentType: string;
  page: number;
}

export const jobBoardKeys = {
  all: ["job-board"] as const,
  list: (filters: JobsFilters) => [...jobBoardKeys.all, "list", filters] as const,
  applied: () => [...jobBoardKeys.all, "applied"] as const,
  resumes: sharedQueryKeys.resumes,
};

export function useJobs(filters: JobsFilters) {
  return useQuery({
    queryKey: jobBoardKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.location) params.set("location", filters.location);
      if (filters.workType) params.set("work_type", filters.workType);
      if (filters.employmentType) params.set("employment_type", filters.employmentType);
      params.set("page", String(filters.page));
      params.set("limit", "20");
      return apiFetch<JobsResponse>(`/api/jobs?${params.toString()}`);
    },
    staleTime: 30 * 1000,
  });
}

export function useAppliedJobIds() {
  return useQuery({
    queryKey: jobBoardKeys.applied(),
    queryFn: () => apiFetch<string[]>("/api/jobs/applied").catch(() => []),
    staleTime: 60 * 1000,
  });
}

export function useJobBoardResumes(enabled: boolean) {
  return useQuery({
    queryKey: jobBoardKeys.resumes(),
    queryFn: async () => {
      const data = await apiFetch<Resume[] | { resumes: Resume[] }>("/api/upload-resume");
      return Array.isArray(data) ? data : (data as { resumes: Resume[] }).resumes || [];
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

export function useApplyToJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      resumeId,
      coverLetter,
    }: {
      jobId: string;
      resumeId?: string;
      coverLetter?: string;
    }) =>
      apiFetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: resumeId || undefined,
          cover_letter: coverLetter || undefined,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: jobBoardKeys.applied() });
      qc.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
