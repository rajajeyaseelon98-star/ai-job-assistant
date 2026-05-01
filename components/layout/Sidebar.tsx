"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/hooks/queries/use-user";
import {
  LayoutDashboard,
  FileText,
  Target,
  Search,
  Rocket,
  Zap,
  Wand2,
  Mail,
  Mic2,
  Linkedin,
  PenLine,
  ClipboardList,
  BarChart3,
  History,
  CreditCard,
  Settings,
  Menu,
  X,
  ArrowLeftRight,
  Briefcase,
  Activity,
  IndianRupee,
  TrendingUp,
  Award,
  Brain,
  Gift,
  MessageSquare,
} from "lucide-react";
import { useMessageUnreadState } from "@/hooks/queries/use-message-unread-state";

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Start here",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/resume-builder", label: "Quick Resume Builder", icon: PenLine },
      { href: "/resume-analyzer", label: "Resume Analyzer", icon: FileText },
      { href: "/job-match", label: "Job Match", icon: Target },
      { href: "/auto-apply", label: "AI Auto-Apply", icon: Rocket },
    ],
  },
  {
    label: "Explore more",
    items: [
      { href: "/job-board", label: "Job Board", icon: Briefcase },
      { href: "/job-finder", label: "Auto Job Finder", icon: Search },
      { href: "/smart-apply", label: "Smart Auto-Apply", icon: Zap },
      { href: "/tailor-resume", label: "Resume Tailoring", icon: Wand2 },
      { href: "/cover-letter", label: "Cover Letter", icon: Mail },
      { href: "/interview-prep", label: "Interview Prep", icon: Mic2 },
      { href: "/career-coach", label: "AI Career Coach", icon: Brain },
    ],
  },
  {
    label: "Advanced",
    items: [{ href: "/import-linkedin", label: "LinkedIn Import", icon: Linkedin }],
  },
  {
    label: "Track & insights",
    items: [
      { href: "/applications", label: "Applications", icon: ClipboardList },
      { href: "/messages", label: "Messages", icon: MessageSquare },
      { href: "/analytics", label: "Career Analytics", icon: BarChart3 },
      { href: "/resume-performance", label: "Resume Performance", icon: Award },
      { href: "/activity", label: "Activity Feed", icon: Activity },
      { href: "/usage", label: "AI Usage", icon: BarChart3 },
      { href: "/salary-insights", label: "Salary Insights", icon: IndianRupee },
      { href: "/skill-demand", label: "Skill Demand", icon: TrendingUp },
      { href: "/streak-rewards", label: "Streak Rewards", icon: Gift },
    ],
  },
  {
    label: "",
    items: [
      { href: "/history", label: "History", icon: History },
      { href: "/pricing", label: "Pricing", icon: CreditCard },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data: user } = useUser();
  const { totalUnread } = useMessageUnreadState();
  const canSwitchToRecruiter = !!user?.recruiter_onboarding_complete;

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when sidebar is open on mobile
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

  // Close on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-40 min-h-11 min-w-11 rounded-lg p-2 text-text transition-colors duration-200 hover:bg-surface-muted active:bg-surface-muted/70 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay with fade animation */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:pointer-events-none lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar with slide animation */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-border bg-card shadow-sm transition-transform duration-300 ease-in-out lg:w-[240px] lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 lg:border-b-0 lg:px-4 lg:py-4">
          <Link href="/dashboard" className="min-w-0">
            <span className="font-display text-base font-semibold tracking-tight text-text lg:text-lg">
              AI Job Assistant
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 min-w-11 rounded-lg p-1.5 text-text-muted transition-colors duration-200 hover:bg-surface-muted hover:text-text active:bg-surface-muted/70 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {navGroups.map((group, gi) => (
            <div key={gi} className={group.label ? "mt-5 first:mt-0" : ""}>
              {group.label && (
                <p className="mb-3 px-3 font-display text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.label.toUpperCase()}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  const showMessagesBadge = item.href === "/messages" && totalUnread > 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      onMouseEnter={() => router.prefetch(item.href)}
                      onTouchStart={() => router.prefetch(item.href)}
                      className={`flex min-h-11 items-center gap-3 rounded-lg border-l-2 py-2 pl-2.5 pr-3 text-sm transition-colors duration-200 ease-in-out ${
                        isActive
                          ? "border-primary bg-surface-muted font-medium text-primary"
                          : "border-transparent text-text-muted hover:bg-surface-muted hover:text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {showMessagesBadge ? (
                        <span
                          className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground"
                        >
                          {totalUnread > 9 ? "9+" : totalUnread}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="safe-bottom shrink-0 space-y-2 border-t border-border px-3 py-3">
          {canSwitchToRecruiter ? (
            <Link
              href="/select-role?next=/recruiter"
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-text-muted shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-surface-muted hover:text-primary"
            >
              <ArrowLeftRight className="h-4 w-4 shrink-0 text-text-muted" />
              <span className="truncate">Switch to Recruiter</span>
            </Link>
          ) : (
            <Link
              href="/select-role?next=/recruiter/company"
              className="flex min-h-11 items-center gap-2 rounded-lg border border-primary/25 bg-surface-muted px-3 py-2.5 text-sm font-medium text-text shadow-sm transition-all duration-200 hover:border-primary/35 hover:bg-surface-muted"
            >
              <Briefcase className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">Hire talent (recruiter)</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
