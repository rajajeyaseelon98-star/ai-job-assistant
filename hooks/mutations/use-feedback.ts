"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (body: { feature: string; resultId?: string; type: "up" | "down" }) =>
      apiFetch<unknown>("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
  });
}
