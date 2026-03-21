"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: typeof LayoutDashboard }[];
}

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Apply",
    items: [
      { href: "/resume-analyzer", label: "Resume Analyzer", icon: FileText },
      { href: "/job-match", label: "Job Match", icon: Target },
      { href: "/job-board", label: "Job Board", icon: Briefcase },
      { href: "/job-finder", label: "Auto Job Finder", icon: Search },
      { href: "/auto-apply", label: "AI Auto-Apply", icon: Rocket },
      { href: "/smart-apply", label: "Smart Auto-Apply", icon: Zap },
    ],
  },
  {
    label: "Improve",
    items: [
      { href: "/tailor-resume", label: "Resume Tailoring", icon: Wand2 },
      { href: "/cover-letter", label: "Cover Letter", icon: Mail },
      { href: "/interview-prep", label: "Interview Prep", icon: Mic2 },
      { href: "/import-linkedin", label: "LinkedIn Import", icon: Linkedin },
      { href: "/career-coach", label: "AI Career Coach", icon: Brain },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/applications", label: "Applications", icon: ClipboardList },
      { href: "/analytics", label: "Career Analytics", icon: BarChart3 },
      { href: "/resume-performance", label: "Resume Performance", icon: Award },
      { href: "/activity", label: "Activity Feed", icon: Activity },
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
  const [open, setOpen] = useState(false);

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
        className="fixed left-3 top-3 z-40 rounded-lg p-2 hover:bg-gray-100 active:bg-gray-200 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-text" />
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
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-gray-200 bg-card shadow-xl transition-transform duration-300 ease-in-out lg:w-[240px] lg:translate-x-0 lg:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 lg:border-b-0 lg:px-4 lg:py-4">
          <Link href="/dashboard" className="min-w-0">
            <span className="text-base font-semibold text-primary lg:text-lg">AI Job Assistant</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 hover:bg-gray-100 active:bg-gray-200 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {navGroups.map((group, gi) => (
            <div key={gi} className={group.label ? "mt-3 first:mt-0" : ""}>
              {group.label && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted/60">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-text-muted hover:bg-gray-100 hover:text-text active:bg-gray-200"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-3 py-3 safe-bottom">
          <Link
            href="/select-role?next=/recruiter"
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-text-muted hover:bg-gray-50 hover:text-text active:bg-gray-100"
          >
            <ArrowLeftRight className="h-4 w-4 shrink-0" />
            <span className="truncate">Switch to Recruiter</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
