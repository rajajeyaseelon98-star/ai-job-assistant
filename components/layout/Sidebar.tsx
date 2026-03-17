"use client";

import { useState } from "react";
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

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/resume-analyzer", label: "Resume Analyzer", icon: FileText },
  { href: "/job-match", label: "Job Match", icon: Target },
  { href: "/job-board", label: "Job Board", icon: Briefcase },
  { href: "/job-finder", label: "Auto Job Finder", icon: Search },
  { href: "/auto-apply", label: "AI Auto-Apply", icon: Rocket },
  { href: "/smart-apply", label: "Smart Auto-Apply", icon: Zap },
  { href: "/tailor-resume", label: "Resume Tailoring", icon: Wand2 },
  { href: "/cover-letter", label: "Cover Letter Generator", icon: Mail },
  { href: "/interview-prep", label: "Interview Prep", icon: Mic2 },
  { href: "/import-linkedin", label: "LinkedIn Import", icon: Linkedin },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/analytics", label: "Career Analytics", icon: BarChart3 },
  { href: "/resume-performance", label: "Resume Performance", icon: Award },
  { href: "/career-coach", label: "AI Career Coach", icon: Brain },
  { href: "/activity", label: "Activity Feed", icon: Activity },
  { href: "/salary-insights", label: "Salary Insights", icon: IndianRupee },
  { href: "/skill-demand", label: "Skill Demand", icon: TrendingUp },
  { href: "/streak-rewards", label: "Streak Rewards", icon: Gift },
  { href: "/history", label: "History", icon: History },
  { href: "/pricing", label: "Pricing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-3 z-40 rounded-lg p-2 hover:bg-gray-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-text" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[240px] border-r border-gray-200 bg-card transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-6 flex items-center justify-between px-2">
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              <span className="text-lg font-semibold text-primary">AI Job Assistant</span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 hover:bg-gray-100 lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-text-muted" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-text-muted hover:bg-gray-100 hover:text-text"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Switch to Recruiter */}
          <Link
            href="/select-role?next=/recruiter"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-text-muted hover:bg-gray-50 hover:text-text"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Switch to Recruiter
          </Link>
        </div>
      </aside>
    </>
  );
}
