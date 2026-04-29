"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, User, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { userKeys } from "@/hooks/queries/use-user";
import { recruiterKeys, useSwitchRole } from "@/hooks/queries/use-recruiter";
import { formatApiFetchThrownError } from "@/lib/api-error";

function SelectRoleContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const switchRoleMut = useSwitchRole();
  const next = searchParams.get("next") || "/dashboard";

  async function selectRole(role: "job_seeker" | "recruiter") {
    setLoading(true);
    setError(null);
    try {
      await switchRoleMut.mutateAsync(role);
      // Wait for fresh role in cache before navigating — otherwise RecruiterLayout sees stale job_seeker and redirects back.
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
      await queryClient.invalidateQueries({ queryKey: recruiterKeys.all });
      await queryClient.refetchQueries({ queryKey: userKeys.me(), type: "all" });
      await queryClient.refetchQueries({ queryKey: recruiterKeys.user(), type: "all" });
      router.push(role === "recruiter" ? "/recruiter" : next);
      router.refresh();
    } catch (e) {
      setError(
        formatApiFetchThrownError(e) ||
          "Something went wrong. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg space-y-4 sm:space-y-5 md:space-y-6 px-4 sm:px-0">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text">Choose Your Role</h1>
          <p className="mt-2 text-sm sm:text-base text-text-muted">
            One account — pick how you want to use the app right now. Job seeker and hiring tools stay on the same login; you can change mode later from the sidebar when you&apos;re set up for both.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-800" role="alert">
            {error}
          </p>
        )}

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
          <button
            onClick={() => selectRole("job_seeker")}
            disabled={loading}
            className="group rounded-xl border-2 border-gray-200 px-4 py-4 sm:p-6 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-text group-hover:text-primary">
              Job Seeker
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-text-muted">
              Upload resumes, get ATS analysis, find matching jobs, generate cover letters, and prepare for interviews.
            </p>
          </button>

          <button
            onClick={() => selectRole("recruiter")}
            disabled={loading}
            className="group rounded-xl border-2 border-gray-200 px-4 py-4 sm:p-6 text-left transition-all hover:border-primary hover:shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-text group-hover:text-primary">
              Recruiter
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-text-muted">
              Post jobs, search candidates, AI-powered screening, manage applications pipeline, and hire top talent.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SelectRolePage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><p className="text-text-muted">Loading...</p></div>}>
      <SelectRoleContent />
    </Suspense>
  );
}
