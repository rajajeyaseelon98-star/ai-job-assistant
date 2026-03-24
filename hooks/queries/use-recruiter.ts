"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export const recruiterKeys = {
  all: ["recruiter"] as const,
  jobs: () => [...recruiterKeys.all, "jobs"] as const,
  job: (id: string) => [...recruiterKeys.all, "jobs", id] as const,
  applications: () => [...recruiterKeys.all, "applications"] as const,
  messages: () => [...recruiterKeys.all, "messages"] as const,
  alerts: () => [...recruiterKeys.all, "alerts"] as const,
  templates: () => [...recruiterKeys.all, "templates"] as const,
  company: () => [...recruiterKeys.all, "company"] as const,
  topCandidates: (params?: string) => [...recruiterKeys.all, "top-candidates", params ?? ""] as const,
  user: () => [...recruiterKeys.all, "user"] as const,
};

/* ─── Queries ─── */

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

export function useRecruiterMessages(opts?: { unread?: boolean }) {
  const url = opts?.unread ? "/api/recruiter/messages?unread=true" : "/api/recruiter/messages";
  return useQuery({
    queryKey: [...recruiterKeys.messages(), opts?.unread ? "unread" : "all"],
    queryFn: () => apiFetch<unknown[]>(url),
    staleTime: 30 * 1000,
  });
}

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

export function useRecruiterCompany() {
  return useQuery({
    queryKey: recruiterKeys.company(),
    queryFn: () => apiFetch<unknown>("/api/recruiter/company"),
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
  });
}

/* ─── Mutations ─── */

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
    mutationFn: ({ id, ...body }: { id?: string; name: string; subject: string | null; content: string; template_type: string }) => {
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
