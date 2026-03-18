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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Resume Performance</h1>
          <p className="text-xs sm:text-sm text-text-muted">
            Track which resume gets the most interviews
          </p>
        </div>
        <button
          onClick={shareBenchmark}
          disabled={sharing}
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover active:bg-primary-hover disabled:opacity-50"
        >
          <Share2 className="h-4 w-4" />
          Share Your Rank
        </button>
      </div>

      {/* Hiring Benchmark */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 sm:p-4 text-center">
          <Crown className="mx-auto mb-1 h-5 w-5 text-purple-600" />
          <div className="text-xl sm:text-2xl font-bold text-purple-700">Top {topPct}%</div>
          <div className="text-xs text-purple-600">Your Ranking</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 text-center">
          <Star className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
          <div className="text-xl sm:text-2xl font-bold text-text">{benchmark.your_score}</div>
          <div className="text-xs text-text-muted">Your Score</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 text-center">
          <BarChart3 className="mx-auto mb-1 h-5 w-5 text-blue-500" />
          <div className="text-xl sm:text-2xl font-bold text-text">{benchmark.avg_score}</div>
          <div className="text-xs text-text-muted">Average Score</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 text-center">
          <Target className="mx-auto mb-1 h-5 w-5 text-green-500" />
          <div className="text-xl sm:text-2xl font-bold text-text">{performance.optimal_daily_apply_count}</div>
          <div className="text-xs text-text-muted">Optimal Daily Apps</div>
        </div>
      </div>

      {/* Benchmark insight */}
      <div className="rounded-lg bg-gray-50 px-4 py-4 sm:px-5 sm:py-5 text-xs sm:text-sm text-text-muted">
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
        <h2 className="mb-3 text-base sm:text-lg font-semibold text-text">Resume Version Performance</h2>
        {performance.resume_versions.length === 0 ? (
          <p className="text-sm text-text-muted">No resume versions to compare yet.</p>
        ) : (
          <div className="space-y-3">
            {performance.resume_versions.map((v) => {
              const isBest = v.resume_id === performance.best_resume_id;
              return (
                <div
                  key={v.resume_id}
                  className={`rounded-xl border p-3 sm:p-4 ${
                    isBest ? "border-green-300 bg-green-50" : "border-gray-200 bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-text-muted" />
                      <div>
                        <h3 className="font-medium text-text">
                          {v.version_label || "Resume"}
                          {isBest && (
                            <span className="ml-2 rounded bg-green-200 px-2 py-0.5 text-xs text-green-800">
                              Best Performer
                            </span>
                          )}
                        </h3>
                        {v.target_role && (
                          <p className="text-xs text-text-muted">Target: {v.target_role}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-text">{v.interview_rate}%</div>
                      <div className="text-xs text-text-muted">Interview Rate</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <div className="font-bold text-text">{v.total_applications}</div>
                      <div className="text-text-muted">Applied</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-600">{v.total_interviews}</div>
                      <div className="text-text-muted">Interviews</div>
                    </div>
                    <div>
                      <div className="font-bold text-blue-600">{v.total_offers}</div>
                      <div className="text-text-muted">Offers</div>
                    </div>
                    <div>
                      <div className="font-bold text-red-500">{v.total_rejections}</div>
                      <div className="text-text-muted">Rejected</div>
                    </div>
                  </div>

                  {v.best_for_roles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
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
