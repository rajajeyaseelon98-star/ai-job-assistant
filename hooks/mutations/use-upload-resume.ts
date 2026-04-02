"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchFormJsonWithHumanizer } from "@/lib/api-fetcher";
import { humanizeUploadResumeError } from "@/lib/friendlyApiError";
import { jobBoardKeys } from "@/hooks/queries/use-job-board";
import { dashboardKeys } from "@/hooks/queries/use-dashboard";

export type UploadResumeResult = {
  id: string;
  parsed_text: string | null;
  file_url?: string;
  created_at?: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

async function postUploadResume(file: File): Promise<UploadResumeResult> {
  if (file.size > MAX_BYTES) {
    throw new Error("File too large. Max 5MB.");
  }
  const form = new FormData();
  form.append("file", file);
  const data = await apiFetchFormJsonWithHumanizer<Record<string, unknown>>(
    "/api/upload-resume",
    form,
    humanizeUploadResumeError
  );
  return {
    id: String(data.id ?? ""),
    parsed_text: (data.parsed_text as string | null) ?? null,
    file_url: data.file_url as string | undefined,
    created_at: data.created_at as string | undefined,
  };
}

export function useUploadResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postUploadResume,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: jobBoardKeys.resumes() });
      void qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
  });
}
