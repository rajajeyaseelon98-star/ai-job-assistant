"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Brain,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  ArrowRight,
  ChevronRight,
  BarChart3,
  Star,
  Minus,
  AlertCircle,
  Info,
  CheckCircle2,
} from "lucide-react";

interface CareerDiagnosis {
  status: "thriving" | "improving" | "struggling" | "critical" | "new";
  headline: string;
  problems: Array<{ issue: string; severity: string; fix: string }>;
  career_direction: Array<{ role: string; reason: string; match_level: string }>;
  skill_roi: Array<{ skill: string; roi_score: number; reason: string; action: string }>;
  weekly_summary: {
    period: string;
    applications_sent: number;
    interviews_earned: number;
    offers_received: number;
    interview_rate_change: number;
    best_action: string;
    worst_action: string;
    recommendation: string;
  } | null;
  score_explanation: {
    ats_breakdown: Record<string, number> | null;
    interview_probability_breakdown: Record<string, number> | null;
    rank_breakdown: Record<string, number> | null;
  };
}

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string; icon: React.ElementType }> = {
  thriving: { bg: "bg-green-50", border: "border-green-300", text: "text-green-800", icon: CheckCircle2 },
  improving: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800", icon: TrendingUp },
  struggling: { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-800", icon: AlertCircle },
  critical: { bg: "bg-red-50", border: "border-red-300", text: "text-red-800", icon: AlertTriangle },
  new: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-800", icon: Info },
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50",
  warning: "border-yellow-200 bg-yellow-50",
  info: "border-blue-200 bg-blue-50",
};

export default function CareerCoachPage() {
  const [data, setData] = useState<CareerDiagnosis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/career-coach")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto w-full py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto w-full py-8">
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 text-center">
          <Brain className="mx-auto mb-3 h-10 w-10 text-indigo-600" />
          <h3 className="font-display text-xl font-bold text-slate-900">Career Coach</h3>
          <p className="mt-1 text-sm text-slate-500">Start applying to jobs to get personalized career coaching.</p>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[data.status] || STATUS_STYLES.new;
  const StatusIcon = statusStyle.icon;

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <Brain className="h-6 w-6 text-indigo-600" />
          AI Career Coach
        </h1>
        <p className="text-slate-500 text-base mt-2">Your personal career strategist — powered by your data</p>
      </div>

      {/* Informational Welcome Alert */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm mb-10">
        <StatusIcon className="text-indigo-600 h-5 w-5 shrink-0" />
        <p className="text-sm font-medium text-indigo-900">{data.headline}</p>
      </div>

      {/* Problems / Diagnosis */}
      {data.problems.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg sm:text-xl font-semibold text-text">
            {data.status === "thriving" ? "Optimization Tips" : "Why You're Not Getting Interviews"}
          </h2>
          <div className="space-y-3">
            {data.problems.map((p, i) => (
              <div key={i} className={`rounded-lg border p-3 sm:p-4 ${SEVERITY_STYLES[p.severity] || SEVERITY_STYLES.info}`}>
                <p className="text-sm font-medium text-text">{p.issue}</p>
                <div className="mt-2 flex items-start gap-2">
                  <Zap className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <p className="text-sm text-primary">{p.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Summary */}
      {data.weekly_summary && (
        <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-text">
            <BarChart3 className="h-4 w-4" />
            This Week&apos;s Performance
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div>
              <div className="text-xl sm:text-2xl font-bold text-text">{data.weekly_summary.applications_sent}</div>
              <div className="text-xs text-text-muted">Applications</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-green-600">{data.weekly_summary.interviews_earned}</div>
              <div className="text-xs text-text-muted">Interviews</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                {data.weekly_summary.interview_rate_change > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : data.weekly_summary.interview_rate_change < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <Minus className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-xl sm:text-2xl font-bold ${
                  data.weekly_summary.interview_rate_change > 0 ? "text-green-600" :
                  data.weekly_summary.interview_rate_change < 0 ? "text-red-600" : "text-text"
                }`}>
                  {data.weekly_summary.interview_rate_change > 0 ? "+" : ""}{data.weekly_summary.interview_rate_change}%
                </span>
              </div>
              <div className="text-xs text-text-muted">Rate Change</div>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-primary/5 p-3 text-sm text-primary">
            <strong>Recommendation:</strong> {data.weekly_summary.recommendation}
          </div>
        </div>
      )}

      {/* Career Direction */}
      {data.career_direction.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg sm:text-xl font-semibold text-text">Career Direction</h2>
          <div className="space-y-2">
            {data.career_direction.map((d) => (
              <div key={d.role} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-card px-3 sm:px-4 py-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className={`h-2 w-2 rounded-full ${
                    d.match_level === "strong" ? "bg-green-500" :
                    d.match_level === "moderate" ? "bg-yellow-500" : "bg-red-400"
                  }`} />
                  <div>
                    <p className="text-sm font-medium capitalize text-text">{d.role}</p>
                    <p className="text-xs text-text-muted">{d.reason}</p>
                  </div>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                  d.match_level === "strong" ? "bg-green-100 text-green-700" :
                  d.match_level === "moderate" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {d.match_level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill ROI */}
      {data.skill_roi.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg sm:text-xl font-semibold text-text">Skill ROI — What to Learn Next</h2>
          <div className="space-y-2">
            {data.skill_roi.map((s) => (
              <div key={s.skill} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-gray-200 bg-card px-3 sm:px-4 py-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {s.action === "highlight" ? (
                    <Star className="h-4 w-4 text-yellow-500" />
                  ) : s.action === "learn" ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-text">{s.skill}</p>
                    <p className="text-xs text-text-muted">{s.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full bg-gray-200">
                    <div
                      className={`h-2 rounded-full ${
                        s.action === "highlight" ? "bg-yellow-400" :
                        s.action === "learn" ? "bg-green-400" : "bg-red-400"
                      }`}
                      style={{ width: `${s.roi_score}%` }}
                    />
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                    s.action === "highlight" ? "bg-yellow-100 text-yellow-700" :
                    s.action === "learn" ? "bg-green-100 text-green-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {s.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Transparency */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mb-8">
        <h2 className="flex items-center gap-2 mb-8">
          <Target className="text-indigo-500 h-5 w-5" />
          <span className="font-display text-xl font-bold text-slate-900">Why Your Scores Are What They Are</span>
        </h2>

        {data.score_explanation.interview_probability_breakdown && (
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Interview Probability Weights</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.score_explanation.interview_probability_breakdown).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center transition-all hover:bg-white hover:shadow-md hover:border-indigo-100 group"
                >
                  <div className="block font-display text-3xl font-bold text-indigo-600 group-hover:scale-110 transition-transform">
                    {value}%
                  </div>
                  <div className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-2">
                    {key.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 italic mt-6 text-center">
              These weights are dynamically adjusted based on your application outcomes.
            </p>
          </div>
        )}

        {data.score_explanation.ats_breakdown && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">ATS Score Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.score_explanation.ats_breakdown).map(([key, value]) => (
                <div
                  key={key}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center transition-all hover:bg-white hover:shadow-md hover:border-indigo-100 group"
                >
                  <div className="block font-display text-3xl font-bold text-indigo-600 group-hover:scale-110 transition-transform">
                    {value}
                  </div>
                  <div className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-2">
                    {key.replace(/_/g, " ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <Link
          href="/auto-apply"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-6 py-3 font-medium transition-all flex items-center gap-2"
        >
          Start Auto-Apply <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/resume-analyzer"
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-200 rounded-xl px-6 py-3 font-medium transition-all flex items-center gap-2"
        >
          Improve Resume <ChevronRight className="h-4 w-4" />
        </Link>
        <Link
          href="/analytics"
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-200 rounded-xl px-6 py-3 font-medium transition-all flex items-center gap-2"
        >
          Full Analytics <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
