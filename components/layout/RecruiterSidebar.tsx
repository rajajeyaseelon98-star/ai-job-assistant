"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/hooks/queries/use-user";
import { useMessageUnreadState } from "@/hooks/queries/use-message-unread-state";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ClipboardList,
  MessageSquare,
  Building2,
  BarChart3,
  Settings,
  Menu,
  X,
  ArrowLeftRight,
  Bell,
  CreditCard,
  FileText,
  IndianRupee,
  GitCompare,
  Crown,
  Zap,
} from "lucide-react";

const nav = [
  { href: "/recruiter", label: "Dashboard", icon: LayoutDashboard },
  { href: "/recruiter/jobs", label: "Job Postings", icon: Briefcase },
  { href: "/recruiter/candidates", label: "Candidate Search", icon: Users },
  { href: "/recruiter/applications", label: "Applications", icon: ClipboardList },
  { href: "/recruiter/messages", label: "Messages", icon: MessageSquare },
  { href: "/recruiter/templates", label: "Templates", icon: FileText },
  { href: "/recruiter/company", label: "Company Profile", icon: Building2 },
  { href: "/recruiter/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/recruiter/usage", label: "AI Usage", icon: BarChart3 },
  { href: "/recruiter/salary-estimator", label: "Salary Estimator", icon: IndianRupee },
  { href: "/recruiter/skill-gap", label: "Skill Gap Report", icon: GitCompare },
  { href: "/recruiter/instant-shortlist", label: "Instant Shortlist", icon: Zap },
  { href: "/recruiter/top-candidates", label: "Top Candidates", icon: Crown },
  { href: "/recruiter/alerts", label: "Saved Alerts", icon: Bell },
  { href: "/recruiter/pricing", label: "Plans & Pricing", icon: CreditCard },
  { href: "/recruiter/settings", label: "Settings", icon: Settings },
];

export function RecruiterSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: user } = useUser();
  const { totalUnread } = useMessageUnreadState();
  // Always allow switching back to job seeker while in recruiter shell (recruiter-only users may have no company row yet).
  const canSwitchToJobSeeker = user?.role === "recruiter";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 rounded-lg p-2 text-foreground transition-colors duration-200 hover:bg-surface-muted active:bg-slate-200/80 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-text" />
      </button>

      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:pointer-events-none lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:w-[240px] lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 lg:border-b-0 lg:px-4 lg:py-4">
          <Link href="/recruiter" className="min-w-0">
            <span className="text-base font-display font-bold tracking-tight text-slate-900 lg:text-lg">Recruiter Panel</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 transition-colors duration-200 hover:bg-surface-muted active:bg-slate-200/80 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="flex flex-col gap-0.5">
            {nav.map((item) => {
              const isActive =
                item.href === "/recruiter"
                  ? pathname === "/recruiter"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              const showMessagesBadge = item.href === "/recruiter/messages" && totalUnread > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onMouseEnter={() => router.prefetch(item.href)}
                  onTouchStart={() => router.prefetch(item.href)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ease-in-out ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600 active:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                  <span className="truncate">{item.label}</span>
                  {showMessagesBadge ? (
                    <span className="ml-auto shrink-0 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                      {totalUnread > 9 ? "9+" : totalUnread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-slate-200 px-3 py-3 safe-bottom">
          {canSwitchToJobSeeker ? (
            <Link
              href="/select-role?next=/dashboard"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-slate-50 hover:text-indigo-600"
            >
              <ArrowLeftRight className="h-4 w-4 shrink-0" />
              <span className="truncate">Switch to Job Seeker</span>
            </Link>
          ) : null}
        </div>
      </aside>
    </>
  );
}
