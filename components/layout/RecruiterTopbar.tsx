"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, LogOut, MessageSquare, Settings } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useRecruiterCompany } from "@/hooks/queries/use-recruiter";
import { useMessageUnreadState } from "@/hooks/queries/use-message-unread-state";

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
  const { totalUnread } = useMessageUnreadState();
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
    <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <div className="w-8 lg:hidden" />
        <span className="hidden text-sm text-text-muted sm:inline">
          Recruiter Dashboard
        </span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/recruiter/messages"
          className="relative min-h-11 min-w-11 rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          aria-label="Messages"
        >
          <MessageSquare className="h-5 w-5" />
          {totalUnread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          ) : null}
        </Link>
        <NotificationBell />
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-surface-muted active:bg-surface-muted/70 sm:gap-2"
          >
            {companyLogo ? (
              <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-border bg-card">
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
              className="ring-1 ring-border"
            />
            <span className="hidden max-w-[120px] truncate text-sm text-text md:inline">{userName}</span>
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
              <Link
                href="/recruiter/settings"
                className="flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm text-text hover:bg-surface-muted"
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
                className="flex min-h-11 w-full items-center gap-2 px-4 py-2.5 text-sm text-text transition-colors duration-200 hover:bg-surface-muted"
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
