"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ImprovedResumeContent } from "@/types/analysis";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { apiFetchJsonWithHumanizer } from "@/lib/api-fetcher";
import { humanizeImproveResumeError } from "@/lib/friendlyApiError";
import { dashboardKeys } from "@/hooks/queries/use-dashboard";

async function postImportLinkedIn(profileText: string): Promise<ImprovedResumeContent> {
  return apiFetchJsonWithHumanizer<ImprovedResumeContent>(
    "/api/import-linkedin",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileText }),
    },
    humanizeImproveResumeError
  );
}

export function useImportLinkedIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: postImportLinkedIn,
    onSuccess: () => {
      dispatchUsageUpdated();
      void qc.invalidateQueries({ queryKey: dashboardKeys.stats() });
      void qc.invalidateQueries({ queryKey: dashboardKeys.history() });
    },
  });
}
