"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, User, CreditCard, LogOut, MessageSquare } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useUsage } from "@/hooks/queries/use-smart-apply";
import { useUser } from "@/hooks/queries/use-user";
import { useMessageUnreadState } from "@/hooks/queries/use-message-unread-state";
import { FREE_PLAN_LIMITS } from "@/lib/usage-limits";

const USAGE_UPDATED_EVENT = "usage-updated";

export function dispatchUsageUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(USAGE_UPDATED_EVENT));
  }
}

interface UsageSummary {
  resume_analysis: { used: number; limit: number };
  job_match: { used: number; limit: number };
  cover_letter: { used: number; limit: number };
  interview_prep: { used: number; limit: number };
}

interface TopbarProps {
  /** Optional override (e.g. Storybook). Prefer live `useUser().plan_type`. */
  planType?: "free" | "pro" | "premium";
}

export function Topbar({ planType: propPlanType }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const messagesHref = pathname.startsWith("/recruiter") ? "/recruiter/messages" : "/messages";
  const { data: userData, isPending: userPending } = useUser();
  const { data: queryUsage } = useUsage();
  const { totalUnread } = useMessageUnreadState();

  const usage = (queryUsage as unknown as UsageSummary) ?? null;
  const resolvedPlan = userData?.plan_type ?? propPlanType ?? "free";
  const isPaidUser = resolvedPlan === "pro" || resolvedPlan === "premium";
  const displayName = userData?.name || userData?.email || "";

  useEffect(() => {
    function onUsageUpdated() {
      queryClient.invalidateQueries({ queryKey: ["shared", "usage"] });
    }
    window.addEventListener(USAGE_UPDATED_EVENT, onUsageUpdated);
    return () => window.removeEventListener(USAGE_UPDATED_EVENT, onUsageUpdated);
  }, [queryClient]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const usedResume = usage?.resume_analysis?.used ?? 0;
  const usedJob = usage?.job_match?.used ?? 0;
  /** Infer limits from plan when usage not yet loaded; align with `FREE_PLAN_LIMITS` (not legacy 2/1). */
  const limitResume =
    usage?.resume_analysis?.limit ?? (isPaidUser ? -1 : FREE_PLAN_LIMITS.resume_analysis);
  const limitJob = usage?.job_match?.limit ?? (isPaidUser ? -1 : FREE_PLAN_LIMITS.job_match);
  const showUpgradeCta = !userPending && userData?.plan_type === "free";
  const showUsageChips = !userPending;

  return (
    <header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <div className="w-8 shrink-0 lg:hidden" />
        {showUsageChips ? (
          <>
            <div className="flex items-center gap-2 md:hidden">
              <span className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium tracking-wide px-3 py-1 rounded-full">
                Resume {usedResume}/{limitResume === -1 ? "\u221E" : limitResume}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium tracking-wide px-3 py-1 rounded-full">
                Jobs {usedJob}/{limitJob === -1 ? "\u221E" : limitJob}
              </span>
            </div>
            <div className="hidden flex-wrap items-center gap-2 md:flex">
              <span className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium tracking-wide px-3 py-1 rounded-full">
                Resume {usedResume}/{limitResume === -1 ? "\u221E" : limitResume}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium tracking-wide px-3 py-1 rounded-full">
                Jobs {usedJob}/{limitJob === -1 ? "\u221E" : limitJob}
              </span>
            </div>
          </>
        ) : (
          <div className="h-7 w-[120px] animate-pulse rounded-full bg-slate-100 md:w-[200px]" aria-hidden />
        )}
        {showUpgradeCta ? (
          <Link
            href="/pricing"
            className="shrink-0 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:py-1.5 sm:text-sm"
          >
            Upgrade
          </Link>
        ) : null}
      </div>
      <p className="hidden max-w-md flex-[2] truncate text-center font-sans text-[11px] leading-snug text-slate-500 lg:block xl:max-w-lg xl:text-xs">
        Stronger applications: score your resume, match roles, and apply with less busywork.
      </p>
      <div className="relative flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2">
        <Link
          href={messagesHref}
          className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Messages"
        >
          <MessageSquare className="h-5 w-5" />
          {totalUnread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold leading-none text-white">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          ) : null}
        </Link>
        <NotificationBell />
        <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-slate-100 active:bg-slate-200/70 sm:gap-2"
        >
          <UserAvatar
            name={displayName}
            avatarUrl={userData?.avatar_url}
            userId={userData?.id}
            size={32}
            className="ring-1 ring-indigo-100"
          />
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-800 transition-colors hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4" /> Profile
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-800 transition-colors hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <CreditCard className="h-4 w-4" /> Billing
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-800 transition-colors hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
