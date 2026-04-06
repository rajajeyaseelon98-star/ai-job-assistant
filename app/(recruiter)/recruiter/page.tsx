"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRecruiterJobs, useRecruiterApplications } from "@/hooks/queries/use-recruiter";
import { useMessageUnreadSummary } from "@/hooks/queries/use-message-unread-summary";
import { Briefcase, Users, ClipboardList, MessageSquare, Plus, TrendingUp } from "lucide-react";

export default function RecruiterDashboardPage() {
  const { data: jobsData, isLoading: jobsLoading } = useRecruiterJobs();
  const { data: appsData, isLoading: appsLoading } = useRecruiterApplications();
  const { data: unreadSummary, isLoading: unreadLoading } = useMessageUnreadSummary();
  const loading = jobsLoading || appsLoading || unreadLoading;

  const jobsArr = (Array.isArray(jobsData) ? jobsData : []) as Record<string, unknown>[];
  const appsArr = (Array.isArray(appsData) ? appsData : []) as Record<string, unknown>[];
  const unreadMessageTotal = useMemo(() => {
    const c = unreadSummary?.counts ?? {};
    return Object.values(c).reduce((sum, n) => sum + n, 0);
  }, [unreadSummary]);

  const stats = {
    activeJobs: jobsArr.filter((j) => j.status === "active").length,
    totalApplications: appsArr.length,
    newApplications: appsArr.filter((a) => a.stage === "applied").length,
    unreadMessages: unreadMessageTotal,
  };
  const recentApps = appsArr.slice(0, 5);

  return (
    <div className="max-w-[1600px] mx-auto w-full py-8 px-6 space-y-4 sm:space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">Recruiter Dashboard</h1>
        <Link
          href="/recruiter/jobs/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-6 py-2.5 font-medium transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <Link href="/recruiter/jobs" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 text-indigo-600">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-display text-3xl font-bold text-slate-900">{loading ? "..." : stats.activeJobs}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Active Jobs</span>
          </div>
        </Link>

        <Link href="/recruiter/applications" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 text-indigo-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-display text-3xl font-bold text-slate-900">{loading ? "..." : stats.totalApplications}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Total Applications</span>
          </div>
        </Link>

        <Link href="/recruiter/applications?stage=applied" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 text-indigo-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-display text-3xl font-bold text-slate-900">{loading ? "..." : stats.newApplications}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">New (Unreviewed)</span>
          </div>
        </Link>

        <Link href="/recruiter/messages" className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md">
          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 text-indigo-600">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <span className="block font-display text-3xl font-bold text-slate-900">{loading ? "..." : stats.unreadMessages}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Unread Messages</span>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
          {[
            { href: "/recruiter/jobs/new", label: "Post a Job", icon: Briefcase },
            { href: "/recruiter/candidates", label: "Search Candidates", icon: Users },
            { href: "/recruiter/applications", label: "Review Applications", icon: ClipboardList },
            { href: "/recruiter/messages", label: "Messages", icon: MessageSquare },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors flex items-center justify-center">
                <action.icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-slate-700 text-sm">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900 mb-6">Recent Applications</h2>
        {loading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : recentApps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-8 text-center">
            <p className="text-sm text-text-muted">No applications yet. Post a job to start receiving applications.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {recentApps.map((app) => (
              <div key={app.id as string} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {String((app.candidate as Record<string, unknown>)?.name || (app.candidate as Record<string, unknown>)?.email || "Candidate")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {String((app.job as Record<string, unknown>)?.title || "Job")} - Score: {String(app.match_score || "N/A")}%
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    String(app.stage).toLowerCase().includes("reject")
                      ? "bg-rose-100 text-rose-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
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
