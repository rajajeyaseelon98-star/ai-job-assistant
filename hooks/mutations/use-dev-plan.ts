"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export function useDevPlanPatch() {
  return useMutation({
    mutationFn: (planType: "free" | "pro" | "premium") =>
      apiFetch<unknown>("/api/dev/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      }),
  });
}
