"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useRecruiterCompany } from "@/hooks/queries/use-recruiter";

interface RecruiterTopbarProps {
  userName: string;
  avatarUrl?: string | null;
  userId?: string;
}

export function RecruiterTopbar({ userName, avatarUrl, userId }: RecruiterTopbarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: companyRow } = useRecruiterCompany();
  const companyLogo =
    companyRow && typeof companyRow === "object"
      ? ((companyRow as Record<string, unknown>).logo_url as string | null | undefined)
      : null;

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

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="w-8 lg:hidden" />
        <span className="hidden text-sm text-text-muted sm:inline">
          Recruiter Dashboard
        </span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell />
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-slate-50 active:bg-slate-100 sm:gap-2"
          >
            {companyLogo ? (
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                <Image
                  src={companyLogo}
                  alt=""
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </span>
            ) : null}
            <UserAvatar
              name={userName}
              avatarUrl={avatarUrl}
              userId={userId}
              size={32}
              className="ring-1 ring-slate-200"
            />
            <span className="hidden max-w-[120px] truncate text-sm text-slate-700 md:inline">{userName}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <Link
                href="/recruiter/settings"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-4 w-4" /> Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void handleLogout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 transition-colors duration-200 hover:bg-slate-50"
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
