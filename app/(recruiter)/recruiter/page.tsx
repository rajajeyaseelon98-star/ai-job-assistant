"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Briefcase, Users, ClipboardList, MessageSquare, Plus, TrendingUp } from "lucide-react";

interface DashboardStats {
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  unreadMessages: number;
}

export default function RecruiterDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    unreadMessages: 0,
  });
  const [recentApps, setRecentApps] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jobsRes, appsRes, msgsRes] = await Promise.all([
          fetch("/api/recruiter/jobs"),
          fetch("/api/recruiter/applications"),
          fetch("/api/recruiter/messages?unread=true"),
        ]);

        if (jobsRes.ok) {
          const jobs = await jobsRes.json();
          const active = Array.isArray(jobs) ? jobs.filter((j: Record<string, unknown>) => j.status === "active").length : 0;
          setStats((s) => ({ ...s, activeJobs: active }));
        }

        if (appsRes.ok) {
          const apps = await appsRes.json();
          if (Array.isArray(apps)) {
            setStats((s) => ({
              ...s,
              totalApplications: apps.length,
              newApplications: apps.filter((a: Record<string, unknown>) => a.stage === "applied").length,
            }));
            setRecentApps(apps.slice(0, 5));
          }
        }

        if (msgsRes.ok) {
          const msgs = await msgsRes.json();
          if (Array.isArray(msgs)) {
            setStats((s) => ({ ...s, unreadMessages: msgs.length }));
          }
        }
      } catch {
        // ignore load errors
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">Recruiter Dashboard</h1>
        <Link
          href="/recruiter/jobs/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 md:gap-6">
        <Link href="/recruiter/jobs" className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Active Jobs</p>
              <p className="text-xl font-bold text-text">{loading ? "..." : stats.activeJobs}</p>
            </div>
          </div>
        </Link>

        <Link href="/recruiter/applications" className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <ClipboardList className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Total Applications</p>
              <p className="text-xl font-bold text-text">{loading ? "..." : stats.totalApplications}</p>
            </div>
          </div>
        </Link>

        <Link href="/recruiter/applications?stage=applied" className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-text-muted">New (Unreviewed)</p>
              <p className="text-xl font-bold text-text">{loading ? "..." : stats.newApplications}</p>
            </div>
          </div>
        </Link>

        <Link href="/recruiter/messages" className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Unread Messages</p>
              <p className="text-xl font-bold text-text">{loading ? "..." : stats.unreadMessages}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-text">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 md:gap-6">
          {[
            { href: "/recruiter/jobs/new", label: "Post a Job", icon: Briefcase, color: "bg-blue-50 text-blue-600" },
            { href: "/recruiter/candidates", label: "Search Candidates", icon: Users, color: "bg-green-50 text-green-600" },
            { href: "/recruiter/applications", label: "Review Applications", icon: ClipboardList, color: "bg-yellow-50 text-yellow-600" },
            { href: "/recruiter/messages", label: "Messages", icon: MessageSquare, color: "bg-purple-50 text-purple-600" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-card p-3 sm:p-4 shadow-sm hover:shadow-md active:shadow-sm transition-shadow min-h-[44px]"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-text">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-text">Recent Applications</h2>
        {loading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : recentApps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-8 text-center">
            <p className="text-sm text-text-muted">No applications yet. Post a job to start receiving applications.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentApps.map((app) => (
              <div key={app.id as string} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 bg-card px-3 py-3 sm:px-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">
                    {String((app.candidate as Record<string, unknown>)?.name || (app.candidate as Record<string, unknown>)?.email || "Candidate")}
                  </p>
                  <p className="text-xs text-text-muted">
                    {String((app.job as Record<string, unknown>)?.title || "Job")} - Score: {String(app.match_score || "N/A")}%
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                  {app.stage as string}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
