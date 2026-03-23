"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Briefcase,
  Award,
  Lightbulb,
  Loader2,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface Insights {
  total_applications: number;
  total_interviews: number;
  total_offers: number;
  total_rejections: number;
  interview_rate: number;
  offer_rate: number;
  avg_response_days: number | null;
  best_performing_skills: string[];
  worst_performing_roles: string[];
  recommendations: string[];
  weight_adjustments: {
    skill_weight: number;
    experience_weight: number;
    quality_weight: number;
  };
}

interface Funnel {
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
  pending: number;
}

export default function AnalyticsPage() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/insights")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setInsights(data.insights);
          setFunnel(data.funnel);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!insights || !funnel) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-text-muted mb-3" />
        <h2 className="text-lg font-semibold text-text">No data yet</h2>
        <p className="text-sm text-text-muted mt-1">Start applying to jobs to see your analytics.</p>
      </div>
    );
  }

  const totalFunnel = funnel.applied + funnel.interviewing + funnel.offers + funnel.rejected + funnel.pending;

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-indigo-600" /> Career Analytics
        </h1>
        <p className="text-slate-500 text-base mb-10 mt-2">
          AI-powered insights from your application history. The system learns and adapts.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={<Briefcase className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />}
          label="Applications"
          value={insights.total_applications}
        />
        <MetricCard
          icon={<Target className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />}
          label="Interviews"
          value={insights.total_interviews}
          subtext={`${insights.interview_rate}% rate`}
        />
        <MetricCard
          icon={<Award className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />}
          label="Offers"
          value={insights.total_offers}
          subtext={insights.total_interviews > 0 ? `${insights.offer_rate}% conversion` : undefined}
        />
        <MetricCard
          icon={<Clock className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />}
          label="Avg Response"
          value={insights.avg_response_days !== null ? `${insights.avg_response_days}d` : "N/A"}
        />
      </div>

      {/* Conversion Funnel */}
      {totalFunnel > 0 && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mb-8">
          <h2 className="flex items-center gap-2 mb-10">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <span className="font-display text-xl font-bold text-slate-900">Conversion Funnel</span>
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
            <FunnelStep label="Saved" count={funnel.pending} total={totalFunnel} color="bg-indigo-600" />
            <ArrowRight className="hidden md:block text-slate-200 px-2 mt-2 h-4 w-4" />
            <FunnelStep label="Applied" count={funnel.applied} total={totalFunnel} color="bg-indigo-600" />
            <ArrowRight className="hidden md:block text-slate-200 px-2 mt-2 h-4 w-4" />
            <FunnelStep label="Interview" count={funnel.interviewing} total={totalFunnel} color="bg-indigo-600" />
            <ArrowRight className="hidden md:block text-slate-200 px-2 mt-2 h-4 w-4" />
            <FunnelStep label="Offer" count={funnel.offers} total={totalFunnel} color="bg-indigo-600" />
          </div>
          {funnel.rejected > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              {funnel.rejected} rejected ({totalFunnel > 0 ? Math.round((funnel.rejected / totalFunnel) * 100) : 0}%)
            </div>
          )}
        </div>
      )}

      {/* AI Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-6 flex items-start gap-4 shadow-sm">
          <Lightbulb className="text-amber-600 shrink-0 mt-0.5 h-5 w-5" />
          <ul className="space-y-2">
            {insights.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-medium text-amber-900 leading-relaxed">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-6">
        {/* Best Performing Skills */}
        {insights.best_performing_skills.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" /> Skills That Get Interviews
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.best_performing_skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 border border-green-200"
                >
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Emphasize these in your resume and applications.
            </p>
          </div>
        )}

        {/* Worst Performing Roles */}
        {insights.worst_performing_roles.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
            <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-400" /> Roles to Reconsider
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.worst_performing_roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 border border-red-200"
                >
                  {role}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-text-muted">
              You&apos;re not getting interviews for these. Consider pivoting.
            </p>
          </div>
        )}
      </div>

      {/* Learning System Status */}
      <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl mt-12">
        <div className="absolute right-6 top-5 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold tracking-wide text-indigo-100">Live</span>
        </div>
        <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
          AI Learning System Active
        </h3>
        <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl">
          The system is analyzing your {insights.total_applications} applications to improve job matching.
          Current scoring weights: Skills {Math.round(insights.weight_adjustments.skill_weight * 100)}%,
          Experience {Math.round(insights.weight_adjustments.experience_weight * 100)}%,
          Resume Quality {Math.round(insights.weight_adjustments.quality_weight * 100)}%.
          {insights.total_applications >= 10
            ? " Weights are being dynamically adjusted based on your outcomes."
            : " Apply to more jobs to help the system learn your patterns."
          }
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtext?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:shadow-md hover:border-indigo-100 group">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      <span className="block font-display text-3xl font-bold text-slate-900">{value}</span>
      {subtext && <p className="text-xs font-medium text-slate-500 mt-1">{subtext}</p>}
    </div>
  );
}

function FunnelStep({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex-1 w-full text-center relative">
      <span className="block font-display text-2xl font-bold text-slate-900">{count}</span>
      <span className="block text-xs font-semibold text-slate-500 mt-1">{label}</span>
      <div className="h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.max(pct, 5)}%` }}
        />
      </div>
      <div className="text-[10px] text-slate-400 mt-1">{pct}%</div>
    </div>
  );
}
