"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, User, Loader2 } from "lucide-react";
import { Suspense } from "react";

function SelectRoleContent() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  async function selectRole(role: "job_seeker" | "recruiter") {
    setLoading(true);
    try {
      const res = await fetch("/api/user/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        router.push(role === "recruiter" ? "/recruiter" : next);
        router.refresh();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text">Choose Your Role</h1>
          <p className="mt-2 text-text-muted">
            You can switch between roles anytime from the sidebar.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => selectRole("job_seeker")}
            disabled={loading}
            className="group rounded-xl border-2 border-gray-200 p-6 text-left transition-all hover:border-primary hover:shadow-md disabled:opacity-50"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-text group-hover:text-primary">
              Job Seeker
            </h3>
            <p className="mt-1 text-sm text-text-muted">
              Upload resumes, get ATS analysis, find matching jobs, generate cover letters, and prepare for interviews.
            </p>
          </button>

          <button
            onClick={() => selectRole("recruiter")}
            disabled={loading}
            className="group rounded-xl border-2 border-gray-200 p-6 text-left transition-all hover:border-primary hover:shadow-md disabled:opacity-50"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-text group-hover:text-primary">
              Recruiter
            </h3>
            <p className="mt-1 text-sm text-text-muted">
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
