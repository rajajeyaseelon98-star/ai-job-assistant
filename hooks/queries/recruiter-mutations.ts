"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";
import type { Message } from "@/types/recruiter";
import { recruiterKeys } from "./recruiter-keys";
import type { ThreadApiResponse } from "./use-thread-messages";
import { userKeys, type UserData } from "./use-user";

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
      void qc.invalidateQueries({ queryKey: recruiterKeys.company() });
      void qc.invalidateQueries({ queryKey: userKeys.all });
      void qc.invalidateQueries({ queryKey: recruiterKeys.user() });
    },
  });
}

export function useUploadCompanyLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, file }: { companyId: string; file: File }) => {
      const form = new FormData();
      form.set("file", file);
      return apiFetch<{ logo_url: string; company: Record<string, unknown> }>(
        `/api/recruiter/company/${companyId}/logo`,
        { method: "POST", body: form }
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: recruiterKeys.company() });
    },
  });
}

export function useRemoveCompanyLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (companyId: string) =>
      apiFetch<{ ok?: boolean; logo_url: null; company: Record<string, unknown> }>(
        `/api/recruiter/company/${companyId}/logo`,
        { method: "DELETE" }
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: recruiterKeys.company() });
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      receiver_id: string;
      subject: string | null;
      content: string;
      attachment_path?: string | null;
      attachment_name?: string | null;
      attachment_mime?: string | null;
    }) =>
      apiFetch<Message>("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (newMsg, variables) => {
      qc.setQueryData<InfiniteData<ThreadApiResponse>>(
        recruiterKeys.threadMessages(variables.receiver_id),
        (old) => {
          if (!old?.pages?.length) return old;
          const p0 = old.pages[0];
          if (p0.messages.some((m) => m.id === newMsg.id)) return old;
          return {
            ...old,
            pages: [{ ...p0, messages: [newMsg, ...p0.messages] }, ...old.pages.slice(1)],
          };
        }
      );
      void qc.invalidateQueries({ queryKey: recruiterKeys.messages() });
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
      apiFetch<{ ok?: boolean; profile_strength?: number }>("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      if (typeof data?.profile_strength === "number") {
        const ps = data.profile_strength;
        const patch = (old: UserData | undefined) =>
          old ? { ...old, profile_strength: ps } : old;
        qc.setQueryData(userKeys.me(), patch);
        qc.setQueryData(recruiterKeys.user(), patch);
      }
      void qc.invalidateQueries({ queryKey: recruiterKeys.user() });
      void qc.invalidateQueries({ queryKey: ["user"] });
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
      apiFetch<{ id?: string; ok?: boolean; message?: string; meta?: Record<string, unknown> }>("/api/recruiter/jobs", {
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
      apiFetch<{ ok?: boolean; message?: string; meta?: Record<string, unknown> }>(`/api/recruiter/jobs/${id}`, {
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
        ok?: boolean;
        message?: string;
        meta?: Record<string, unknown>;
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
      apiFetch<{
        ok?: boolean;
        message?: string;
        meta?: Record<string, unknown>;
        shortlisted: number;
        total_screened: number;
        itemized?: Array<{
          application_id: string;
          status: "success" | "skipped" | "failed";
          reason: string;
        }>;
      }>(
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
