"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch, apiFetchMultipartJson } from "@/lib/api-fetcher";

async function postExtractResumeFormData(fd: FormData): Promise<{ text: string }> {
  const data = await apiFetchMultipartJson<{ text?: string; error?: string }>(
    "/api/public/extract-resume",
    fd
  );
  if (!data.text) {
    throw new Error(data.error ?? "Could not read file");
  }
  return { text: data.text };
}

export function usePublicExtractResume() {
  return useMutation({
    mutationFn: postExtractResumeFormData,
  });
}

export function usePublicFresherResume() {
  return useMutation({
    mutationFn: (body: {
      desiredRole: string;
      education: string;
      skills: string;
      projects: string;
    }) =>
      apiFetch<{ resumeText?: string; atsScore?: number; error?: string }>(
        "/api/public/fresher-resume",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      ),
  });
}
