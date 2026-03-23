"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, User, CreditCard, LogOut } from "lucide-react";

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
  planType: "free" | "pro" | "premium";
  usage?: UsageSummary;
}

export function Topbar({ planType, usage: initialUsage }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<UsageSummary | null>(initialUsage ?? null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (initialUsage) setUsage(initialUsage);
  }, [initialUsage]);

  useEffect(() => {
    function fetchUsage() {
      fetch("/api/usage")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setUsage(data);
        })
        .catch(() => {});
    }
    function onUsageUpdated() {
      fetchUsage();
    }
    window.addEventListener(USAGE_UPDATED_EVENT, onUsageUpdated);
    return () => window.removeEventListener(USAGE_UPDATED_EVENT, onUsageUpdated);
  }, []);

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
  const limitResume = usage?.resume_analysis?.limit ?? 2;
  const usedJob = usage?.job_match?.used ?? 0;
  const limitJob = usage?.job_match?.limit ?? 1;

  return (
    <header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-md sm:px-6">
      {/* Left side: spacer for hamburger on mobile + usage info */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {/* Spacer for hamburger button on mobile */}
        <div className="w-8 shrink-0 lg:hidden" />
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
        {planType === "free" && (
          <Link
            href="/pricing"
            className="shrink-0 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:py-1.5 sm:text-sm"
          >
            Upgrade
          </Link>
        )}
      </div>
      <p className="hidden max-w-md flex-[2] truncate text-center font-sans text-[11px] leading-snug text-slate-500 lg:block xl:max-w-lg xl:text-xs">
        Up to <span className="font-semibold text-slate-800">3× more interviews</span> — we help you apply, not only advise.
      </p>
      {/* Right side: user dropdown */}
      <div className="relative flex min-w-0 flex-1 justify-end" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-slate-100 active:bg-slate-200/70 sm:gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
            <User className="h-4 w-4" />
          </div>
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
    </header>
  );
}
