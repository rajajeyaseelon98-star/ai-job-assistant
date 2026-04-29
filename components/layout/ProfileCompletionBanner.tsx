"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/queries/use-user";

/**
 * Sticky strip below the top bar until the account meets onboarding / strength rules:
 * job seekers: profile_strength ≥ 70; recruiters: company onboarding done.
 */
export function ProfileCompletionBanner() {
  const { data: user } = useUser();
  const pathname = usePathname() ?? "";

  if (!user) return null;

  const strength = user.profile_strength ?? 0;
  const incompleteSeeker = user.role === "job_seeker" && strength < 70;
  const incompleteRecruiter = user.role === "recruiter" && !user.recruiter_onboarding_complete;

  if (!incompleteSeeker && !incompleteRecruiter) return null;

  const onSettingsPage = pathname === "/settings";
  const onCompanyPage =
    pathname === "/recruiter/company" || pathname.startsWith("/recruiter/company/");

  return (
    <div
      role="status"
      className="border-b border-amber-200/80 bg-amber-50 px-4 py-2.5 sm:px-5 md:px-6 text-sm text-amber-950"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="font-medium">
          {incompleteSeeker ? (
            <>
              Complete your profile (currently {strength}% — aim for at least 70%) so recruiters see you at your
              best.
            </>
          ) : (
            <>Finish your company profile to unlock the full recruiter experience.</>
          )}
        </p>
        {incompleteSeeker && onSettingsPage ? (
          <span className="shrink-0 text-xs font-medium text-amber-900/90">
            You&apos;re on Settings — use the sections below to raise your score.
          </span>
        ) : incompleteSeeker ? (
          <Link
            href="/settings"
            className="shrink-0 font-semibold text-amber-900 underline underline-offset-4 hover:text-amber-950"
          >
            Go to settings
          </Link>
        ) : incompleteRecruiter && onCompanyPage ? (
          <span className="shrink-0 text-xs font-medium text-amber-900/90">
            Add your company details in the form below.
          </span>
        ) : incompleteRecruiter ? (
          <Link
            href="/recruiter/company"
            className="shrink-0 font-semibold text-amber-900 underline underline-offset-4 hover:text-amber-950"
          >
            Add company
          </Link>
        ) : null}
      </div>
    </div>
  );
}
