"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  TrendingUp,
  Award,
  Loader2,
  Star,
  Target,
  Zap,
  Share2,
  Crown,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface ResumePerformanceData {
  resume_id: string;
  version_label: string | null;
  target_role: string | null;
  total_applications: number;
  total_interviews: number;
  total_offers: number;
  total_rejections: number;
  interview_rate: number;
  offer_rate: number;
  avg_match_score: number;
  best_for_roles: string[];
}

interface HiringBenchmark {
  percentile: number;
  total_candidates: number;
  your_score: number;
  avg_score: number;
  top_factor: string;
}

interface ApplySuccessIntelligence {
  resume_versions: ResumePerformanceData[];
  best_resume_id: string | null;
  best_resume_label: string | null;
  best_interview_rate: number;
  insights: string[];
  score_threshold_insight: string | null;
  optimal_daily_apply_count: number;
  role_recommendations: Array<{ role: string; interview_rate: number }>;
}

export default function ResumePerformancePage() {
  const [data, setData] = useState<{
    performance: ApplySuccessIntelligence;
    benchmark: HiringBenchmark;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    fetch("/api/resume-performance")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function shareBenchmark() {
    if (!data) return;
    setSharing(true);
    try {
      const res = await fetch("/api/share-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hiring_benchmark",
          data: {
            percentile: data.benchmark.percentile,
            your_score: data.benchmark.your_score,
            top_factor: data.benchmark.top_factor,
          },
        }),
      });
      if (res.ok) {
        const { url } = await res.json();
        const fullUrl = `${window.location.origin}${url}`;
        await navigator.clipboard.writeText(fullUrl);
        alert("Share link copied to clipboard!");
      }
    } catch {
      alert("Failed to create share link");
    }
    setSharing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-card p-8 text-center">
        <FileText className="mx-auto mb-3 h-10 w-10 text-text-muted" />
        <h3 className="font-medium text-text">No data available</h3>
        <p className="mt-1 text-sm text-text-muted">Upload a resume and start applying to see performance data.</p>
      </div>
    );
  }

  const { performance, benchmark } = data;
  const topPct = 100 - benchmark.percentile;

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Resume Performance</h1>
          <p className="text-slate-500 text-base mt-2">
            Track which resume gets the most interviews
          </p>
        </div>
        <button
          onClick={shareBenchmark}
          disabled={sharing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-5 py-2.5 text-sm font-medium transition-all flex items-center gap-2 w-full sm:w-auto disabled:opacity-50"
        >
          <Share2 className="h-4 w-4" />
          Share Your Rank
        </button>
      </div>

      {/* Hiring Benchmark */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 shadow-sm rounded-2xl p-6 text-center relative overflow-hidden">
          <Crown className="text-indigo-600 mb-3 mx-auto h-5 w-5" />
          <span className="block font-display text-3xl font-bold text-indigo-900">Top {topPct}%</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mt-1">Your Ranking</span>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center transition-all hover:shadow-md">
          <Star className="mx-auto mb-1 h-5 w-5 text-amber-500" />
          <span className="block font-display text-2xl font-bold text-slate-900">{benchmark.your_score}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Your Score</span>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center transition-all hover:shadow-md">
          <BarChart3 className="mx-auto mb-1 h-5 w-5 text-blue-500" />
          <span className="block font-display text-2xl font-bold text-slate-900">{benchmark.avg_score}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Average Score</span>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-center transition-all hover:shadow-md">
          <Target className="mx-auto mb-1 h-5 w-5 text-emerald-500" />
          <span className="block font-display text-2xl font-bold text-slate-900">{performance.optimal_daily_apply_count}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Optimal Daily Apps</span>
        </div>
      </div>

      {/* Benchmark insight */}
      <div className="text-sm text-slate-500 mb-8 p-4 bg-slate-50 border border-slate-100 rounded-xl text-center italic">
        {benchmark.top_factor}
      </div>

      {/* AI Insights */}
      {performance.insights.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 sm:px-5 sm:py-5">
          <h3 className="flex items-center gap-2 text-sm sm:text-base font-semibold text-blue-900">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
            AI Insights
          </h3>
          <ul className="mt-2 space-y-1">
            {performance.insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                <TrendingUp className="mt-0.5 h-3 w-3 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Threshold Insight */}
      {performance.score_threshold_insight && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 sm:px-5 sm:py-5">
          <p className="flex items-center gap-2 text-xs sm:text-sm font-medium text-green-800">
            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
            {performance.score_threshold_insight}
          </p>
        </div>
      )}

      {/* Resume Versions */}
      <div>
        <h2 className="font-display text-xl font-bold text-slate-900 mb-6">Resume Version Performance</h2>
        {performance.resume_versions.length === 0 ? (
          <p className="text-sm text-text-muted">No resume versions to compare yet.</p>
        ) : (
          <div className="space-y-4">
            {performance.resume_versions.map((v) => {
              const isBest = v.resume_id === performance.best_resume_id;
              return (
                <div
                  key={v.resume_id}
                  className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:border-indigo-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-slate-900 text-base">
                          {v.version_label || "Resume"}
                          {isBest && (
                            <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 border border-green-200">
                              Best Performer
                            </span>
                          )}
                        </h3>
                        {v.target_role && (
                          <p className="text-xs text-slate-500">Target: {v.target_role}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-8 md:gap-12 flex-1">
                      <div className="text-center md:text-left">
                        <span className="block font-display text-lg font-bold text-slate-900">{v.total_applications}</span>
                        <span className="block text-[10px] font-bold uppercase text-slate-400">Applied</span>
                      </div>
                      <div className="text-center md:text-left">
                        <span className="block font-display text-lg font-bold text-slate-900">{v.total_interviews}</span>
                        <span className="block text-[10px] font-bold uppercase text-slate-400">Interviews</span>
                      </div>
                      <div className="text-center md:text-left">
                        <span className="block font-display text-lg font-bold text-slate-900">{v.total_offers}</span>
                        <span className="block text-[10px] font-bold uppercase text-slate-400">Offers</span>
                      </div>
                      <div className="text-center md:text-left">
                        <span className="block font-display text-lg font-bold text-slate-900">{v.total_rejections}</span>
                        <span className="block text-[10px] font-bold uppercase text-slate-400">Rejected</span>
                      </div>
                    </div>

                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-6 py-3 text-center min-w-[120px]">
                      <span className="block font-display text-2xl font-bold text-indigo-600">{v.interview_rate}%</span>
                      <span className="text-[10px] font-bold uppercase text-indigo-400">Interview Rate</span>
                    </div>
                  </div>

                  {v.best_for_roles.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 md:ml-16">
                      {v.best_for_roles.map((role) => (
                        <span key={role} className="rounded bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Recommendations */}
      {performance.role_recommendations.length > 0 && (
        <div>
          <h2 className="mb-3 text-base sm:text-lg font-semibold text-text">Role Performance</h2>
          <div className="space-y-2">
            {performance.role_recommendations.map((r) => (
              <div
                key={r.role}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-card px-3 py-3 sm:px-4"
              >
                <span className="text-xs sm:text-sm font-medium text-text truncate mr-2">{r.role}</span>
                <span className={`flex items-center gap-1 text-xs sm:text-sm font-bold shrink-0 ${
                  r.interview_rate >= 30 ? "text-green-600" : r.interview_rate >= 10 ? "text-yellow-600" : "text-red-500"
                }`}>
                  {r.interview_rate >= 30 ? <ArrowUp className="h-3 w-3" /> : r.interview_rate < 10 ? <ArrowDown className="h-3 w-3" /> : null}
                  {r.interview_rate}% interviews
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
