"use client";

import { useMemo } from "react";
import { BarChart3, Users, Briefcase, TrendingUp, Target } from "lucide-react";
import { useRecruiterJobs, useRecruiterApplications } from "@/hooks/queries/use-recruiter";

interface Analytics {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  avgMatchScore: number;
  stageBreakdown: Record<string, number>;
  topJobs: { title: string; applications: number }[];
  hiringRate: number;
}

export default function AnalyticsPage() {
  const { data: jobsRaw, isLoading: jobsLoading, error: jobsError } = useRecruiterJobs();
  const { data: appsRaw, isLoading: appsLoading, error: appsError } = useRecruiterApplications();
  const loading = jobsLoading || appsLoading;

  const data = useMemo(() => {
    if (loading) return null;
    const jobsArr = Array.isArray(jobsRaw) ? (jobsRaw as Record<string, unknown>[]) : [];
    const appsArr = Array.isArray(appsRaw) ? (appsRaw as Record<string, unknown>[]) : [];
    const stageBreakdown: Record<string, number> = {};
    let totalScore = 0;
    let scoreCount = 0;
    appsArr.forEach((app) => {
      const stage = app.stage as string;
      stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
      if (typeof app.match_score === "number") {
        totalScore += app.match_score;
        scoreCount++;
      }
    });
    const hired = stageBreakdown["hired"] || 0;
    const hiringRate = appsArr.length > 0 ? Math.round((hired / appsArr.length) * 100) : 0;
    const topJobs = [...jobsArr]
      .sort((a, b) => ((b.application_count as number) || 0) - ((a.application_count as number) || 0))
      .slice(0, 5)
      .map((j) => ({ title: j.title as string, applications: (j.application_count as number) || 0 }));
    return {
      totalJobs: jobsArr.length,
      activeJobs: jobsArr.filter((j) => j.status === "active").length,
      totalApplications: appsArr.length,
      avgMatchScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
      stageBreakdown,
      topJobs,
      hiringRate,
    };
  }, [jobsRaw, appsRaw, loading]);

  if (loading) return <p className="text-sm text-slate-500">Loading analytics...</p>;
  if (jobsError || appsError || !data) return <p className="text-sm text-red-500">Failed to load analytics.</p>;

  return (
    <div className="max-w-[1400px] mx-auto w-full py-10 px-6 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Command center view of recruiter performance and funnel velocity.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Total Jobs", value: data.totalJobs, icon: Briefcase, color: "bg-blue-100 text-blue-600" },
          { label: "Total Applications", value: data.totalApplications, icon: Users, color: "bg-green-100 text-green-600" },
          { label: "Avg Match Score", value: `${data.avgMatchScore}%`, icon: Target, color: "bg-purple-100 text-purple-600" },
          { label: "Hiring Rate", value: `${data.hiringRate}%`, icon: TrendingUp, color: "bg-orange-100 text-orange-600" },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <div>
              <span className="block font-display text-3xl font-bold text-slate-900">{m.value}</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1.5">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Breakdown */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] p-8 mb-8">
        <h2 className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
          <BarChart3 className="text-indigo-600 w-5 h-5" />
          <span className="font-display text-lg font-bold text-slate-800">Pipeline Breakdown</span>
        </h2>
        <div>
          {Object.entries(data.stageBreakdown).map(([stage, count]) => {
            const pct = data.totalApplications > 0 ? Math.round((count / data.totalApplications) * 100) : 0;
            return (
              <div key={stage} className="mb-6 last:mb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-600 capitalize">{stage.replace(/_/g, " ")}</span>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{count} ({pct}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Jobs */}
      {data.topJobs.length > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] overflow-hidden p-8">
          <h2 className="font-display text-lg font-bold text-slate-800">Top Jobs by Applications</h2>
          <div className="mt-6 border border-slate-50 rounded-2xl overflow-hidden">
            {data.topJobs.map((job, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <span className="text-sm font-bold text-slate-800 truncate min-w-0 flex-1">{job.title}</span>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full shrink-0">{job.applications} applicants</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
