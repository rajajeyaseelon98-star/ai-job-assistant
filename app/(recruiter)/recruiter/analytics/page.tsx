"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, Briefcase, TrendingUp, Target } from "lucide-react";

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
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [jobsRes, appsRes] = await Promise.all([
          fetch("/api/recruiter/jobs"),
          fetch("/api/recruiter/applications"),
        ]);

        const jobs = jobsRes.ok ? await jobsRes.json() : [];
        const apps = appsRes.ok ? await appsRes.json() : [];

        const jobsArr = Array.isArray(jobs) ? jobs : [];
        const appsArr = Array.isArray(apps) ? apps : [];

        const stageBreakdown: Record<string, number> = {};
        let totalScore = 0;
        let scoreCount = 0;

        appsArr.forEach((app: Record<string, unknown>) => {
          const stage = app.stage as string;
          stageBreakdown[stage] = (stageBreakdown[stage] || 0) + 1;
          if (typeof app.match_score === "number") {
            totalScore += app.match_score;
            scoreCount++;
          }
        });

        const hired = stageBreakdown["hired"] || 0;
        const hiringRate = appsArr.length > 0 ? Math.round((hired / appsArr.length) * 100) : 0;

        const topJobs = jobsArr
          .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
            ((b.application_count as number) || 0) - ((a.application_count as number) || 0)
          )
          .slice(0, 5)
          .map((j: Record<string, unknown>) => ({
            title: j.title as string,
            applications: (j.application_count as number) || 0,
          }));

        setData({
          totalJobs: jobsArr.length,
          activeJobs: jobsArr.filter((j: Record<string, unknown>) => j.status === "active").length,
          totalApplications: appsArr.length,
          avgMatchScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
          stageBreakdown,
          topJobs,
          hiringRate,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="text-sm text-text-muted">Loading analytics...</p>;
  if (!data) return <p className="text-sm text-text-muted">Failed to load analytics.</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Analytics</h1>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Jobs", value: data.totalJobs, icon: Briefcase, color: "bg-blue-100 text-blue-600" },
          { label: "Total Applications", value: data.totalApplications, icon: Users, color: "bg-green-100 text-green-600" },
          { label: "Avg Match Score", value: `${data.avgMatchScore}%`, icon: Target, color: "bg-purple-100 text-purple-600" },
          { label: "Hiring Rate", value: `${data.hiringRate}%`, icon: TrendingUp, color: "bg-orange-100 text-orange-600" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${m.color}`}>
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-muted">{m.label}</p>
                <p className="text-xl font-bold text-text">{m.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Breakdown */}
      <div className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text">
          <BarChart3 className="h-5 w-5 text-primary" /> Pipeline Breakdown
        </h2>
        <div className="space-y-3">
          {Object.entries(data.stageBreakdown).map(([stage, count]) => {
            const pct = data.totalApplications > 0 ? Math.round((count / data.totalApplications) * 100) : 0;
            return (
              <div key={stage} className="flex items-center gap-3">
                <span className="w-32 text-sm capitalize text-text-muted">{stage.replace(/_/g, " ")}</span>
                <div className="flex-1 rounded-full bg-gray-100 h-4">
                  <div className="h-4 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 text-right text-sm font-medium text-text">{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Jobs */}
      {data.topJobs.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-text">Top Jobs by Applications</h2>
          <div className="space-y-2">
            {data.topJobs.map((job, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2">
                <span className="text-sm text-text">{job.title}</span>
                <span className="text-sm font-medium text-primary">{job.applications} applicants</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
