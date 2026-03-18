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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-card px-4 sm:px-6">
      {/* Left side: spacer for hamburger on mobile + usage info */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Spacer for hamburger button on mobile */}
        <div className="w-8 lg:hidden" />
        <span className="hidden text-xs text-text-muted sm:text-sm md:inline">
          Resume {usedResume}/{limitResume === -1 ? "\u221E" : limitResume} · Jobs {usedJob}/{limitJob === -1 ? "\u221E" : limitJob}
        </span>
        {planType === "free" && (
          <Link
            href="/pricing"
            className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20 sm:px-3 sm:py-1.5 sm:text-sm"
          >
            Upgrade
          </Link>
        )}
      </div>
      {/* Right side: user dropdown */}
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-gray-100 active:bg-gray-200 sm:gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-card py-1 shadow-lg">
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-gray-50 active:bg-gray-100"
              onClick={() => setOpen(false)}
            >
              <User className="h-4 w-4" /> Profile
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-gray-50 active:bg-gray-100"
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
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-gray-50 active:bg-gray-100"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
