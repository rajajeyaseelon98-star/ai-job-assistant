"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import { recruiterKeys } from "./recruiter-keys";

export function useRecruiterResumeSignedUrl() {
  return useMutation({
    mutationFn: (resumeId: string) =>
      apiFetch<{ url?: string }>(`/api/recruiter/resumes/${resumeId}/download`),
  });
}

export function useRecruiterResumeAnalyze() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { resumeId: string; candidateId: string }) =>
      apiFetch<unknown>(`/api/recruiter/resumes/${vars.resumeId}/analyze`, {
        method: "POST",
      }),
    onSuccess: (_data, { candidateId }) => {
      void qc.invalidateQueries({ queryKey: recruiterKeys.candidateDetail(candidateId) });
    },
  });
}

export function useToggleJobStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch<unknown>(`/api/recruiter/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.jobs() });
    },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/recruiter/jobs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.jobs() });
    },
  });
}

export function useUpdateApplicationStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; stage?: string; recruiter_rating?: number }) =>
      apiFetch<unknown>(`/api/recruiter/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.applications() });
    },
  });
}

export function useScreenApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<unknown>(`/api/recruiter/applications/${id}/screen`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.applications() });
    },
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<unknown>("/api/recruiter/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.alerts() });
    },
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/recruiter/alerts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.alerts() });
    },
  });
}

export function useSaveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown>) => {
      const isUpdate = !!id;
      const url = isUpdate ? `/api/recruiter/company/${id}` : "/api/recruiter/company";
      return apiFetch<Record<string, unknown>>(url, {
        method: isUpdate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.company() });
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { receiver_id: string; subject: string | null; content: string }) =>
      apiFetch<unknown>("/api/recruiter/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.messages() });
    },
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id?: string; name: string; subject: string | null; content: string; template_type: string }) => {
      if (id) {
        return apiFetch<unknown>(`/api/recruiter/templates/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      return apiFetch<unknown>("/api/recruiter/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.templates() });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/recruiter/templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.templates() });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<unknown>("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.user() });
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useSwitchRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: string) =>
      apiFetch<unknown>("/api/user/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recruiterKeys.user() });
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function usePushCandidate() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<unknown>("/api/recruiter/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
  });
}

export function useInstantShortlist() {
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<unknown>("/api/recruiter/instant-shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
  });
}

/** AI: POST /api/recruiter/jobs/generate-description */
export function useGenerateJobDescription() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<{
        description?: string;
        requirements?: string;
        skills_required?: string[];
      }>("/api/recruiter/jobs/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}

export function useCreateRecruiterJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<unknown>("/api/recruiter/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: recruiterKeys.jobs() });
    },
  });
}

export function usePatchRecruiterJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      apiFetch<unknown>(`/api/recruiter/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: recruiterKeys.jobs() });
      void qc.invalidateQueries({ queryKey: recruiterKeys.job(id) });
    },
  });
}

export function useOptimizeRecruiterJob() {
  return useMutation({
    mutationFn: (jobId: string) =>
      apiFetch<{
        suggestions: string[];
        optimized_title?: string;
        optimized_description?: string;
        score: number;
      }>(`/api/recruiter/jobs/${jobId}/optimize`, { method: "POST" }),
  });
}

export function useAutoShortlistRecruiterJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      apiFetch<{ shortlisted: number; total_screened: number }>(
        `/api/recruiter/jobs/${jobId}/auto-shortlist`,
        { method: "POST" }
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: recruiterKeys.applications() });
      void qc.invalidateQueries({ queryKey: recruiterKeys.jobs() });
    },
  });
}

export type RecruiterSkillGapResult = {
  matching_skills: string[];
  missing_skills: string[];
  transferable_skills: string[];
  recommendations: string[];
  gap_score: number;
};

export function useRecruiterSkillGap() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<RecruiterSkillGapResult>("/api/recruiter/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}

export type RecruiterSalaryEstimateResult = {
  min: number;
  max: number;
  median: number;
  currency: string;
  factors: string[];
  market_insight: string;
};

export function useRecruiterSalaryEstimate() {
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<RecruiterSalaryEstimateResult>("/api/recruiter/salary-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}
