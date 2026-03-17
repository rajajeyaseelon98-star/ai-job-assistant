"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, User, LogOut, Settings } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

interface RecruiterTopbarProps {
  userName: string;
}

export function RecruiterTopbar({ userName }: RecruiterTopbarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-card px-6">
      <span className="text-sm text-text-muted">
        Recruiter Dashboard
      </span>
      <div className="flex items-center gap-2">
        <NotificationBell />
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden text-sm text-text md:inline">{userName}</span>
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-card py-1 shadow-lg">
            <Link
              href="/recruiter/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text hover:bg-gray-50"
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
