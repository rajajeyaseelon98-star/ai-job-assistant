"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-3 z-40 rounded-lg p-2 hover:bg-gray-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-text" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[240px] border-r border-gray-200 bg-card transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-6 flex items-center justify-between px-2">
            <Link href="/recruiter" onClick={() => setOpen(false)}>
              <span className="text-lg font-semibold text-primary">Recruiter Panel</span>
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
              const isActive =
                item.href === "/recruiter"
                  ? pathname === "/recruiter"
                  : pathname.startsWith(item.href);
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

          {/* Switch to job seeker */}
          <Link
            href="/select-role?next=/dashboard"
            className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-text-muted hover:bg-gray-50 hover:text-text"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Switch to Job Seeker
          </Link>
        </div>
      </aside>
    </>
  );
}
