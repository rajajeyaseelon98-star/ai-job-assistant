"use client";

import { Briefcase, User } from "lucide-react";
import type { LandingRole } from "./landingTypes";

type Props = {
  role: LandingRole;
  onRoleChange: (r: LandingRole) => void;
};

/**
 * Mode selection — “Find a Job” vs “Hire Talent” with microcopy (feels like switching apps).
 */
export function LandingRoleToggle({ role, onRoleChange }: Props) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div
        className="inline-flex w-full rounded-full border border-slate-200 bg-white p-1 shadow-sm"
        role="tablist"
        aria-label="Choose mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={role === "job_seeker"}
          onClick={() => onRoleChange("job_seeker")}
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out md:text-base ${
            role === "job_seeker"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          }`}
        >
          <span className="text-base" aria-hidden>
            👤
          </span>
          <User className="h-4 w-4 shrink-0 opacity-90 md:h-5 md:w-5" />
          <span className="whitespace-nowrap">Find a Job</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === "recruiter"}
          onClick={() => onRoleChange("recruiter")}
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 ease-in-out md:text-base ${
            role === "recruiter"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          }`}
        >
          <span className="text-base" aria-hidden>
            🏢
          </span>
          <Briefcase className="h-4 w-4 shrink-0 opacity-90 md:h-5 md:w-5" />
          <span className="whitespace-nowrap">Hire Talent</span>
        </button>
      </div>
      <p className="mt-2 text-center text-xs leading-snug text-text-muted md:text-sm">
        {role === "job_seeker" ? (
          <>For candidates looking to get more interviews</>
        ) : (
          <>For companies hiring faster with AI</>
        )}
      </p>
    </div>
  );
}
