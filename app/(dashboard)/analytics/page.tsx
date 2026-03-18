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
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl font-bold text-text">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Career Analytics
        </h1>
        <p className="mt-1 text-sm sm:text-base text-text-muted">
          AI-powered insights from your application history. The system learns and adapts.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <MetricCard
          icon={<Briefcase className="h-5 w-5 text-blue-500" />}
          label="Applications"
          value={insights.total_applications}
          color="blue"
        />
        <MetricCard
          icon={<Target className="h-5 w-5 text-purple-500" />}
          label="Interviews"
          value={insights.total_interviews}
          subtext={`${insights.interview_rate}% rate`}
          color="purple"
        />
        <MetricCard
          icon={<Award className="h-5 w-5 text-green-500" />}
          label="Offers"
          value={insights.total_offers}
          subtext={insights.total_interviews > 0 ? `${insights.offer_rate}% conversion` : undefined}
          color="green"
        />
        <MetricCard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          label="Avg Response"
          value={insights.avg_response_days !== null ? `${insights.avg_response_days}d` : "N/A"}
          color="amber"
        />
      </div>

      {/* Conversion Funnel */}
      {totalFunnel > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
          <h2 className="text-lg sm:text-xl font-semibold text-text mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" /> Conversion Funnel
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
            <FunnelStep label="Saved" count={funnel.pending} total={totalFunnel} color="bg-gray-400" />
            <ArrowRight className="h-4 w-4 text-text-muted shrink-0 rotate-90 sm:rotate-0" />
            <FunnelStep label="Applied" count={funnel.applied} total={totalFunnel} color="bg-blue-500" />
            <ArrowRight className="h-4 w-4 text-text-muted shrink-0 rotate-90 sm:rotate-0" />
            <FunnelStep label="Interview" count={funnel.interviewing} total={totalFunnel} color="bg-purple-500" />
            <ArrowRight className="h-4 w-4 text-text-muted shrink-0 rotate-90 sm:rotate-0" />
            <FunnelStep label="Offer" count={funnel.offers} total={totalFunnel} color="bg-green-500" />
          </div>
          {funnel.rejected > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-text-muted">
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              {funnel.rejected} rejected ({totalFunnel > 0 ? Math.round((funnel.rejected / totalFunnel) * 100) : 0}%)
            </div>
          )}
        </div>
      )}

      {/* AI Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 sm:p-4 md:p-5">
          <h2 className="text-lg sm:text-xl font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" /> AI Recommendations
          </h2>
          <ul className="space-y-2">
            {insights.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
                {rec}
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
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 sm:p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          AI Learning System Active
        </h3>
        <p className="text-xs text-blue-800">
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
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-text-muted">{label}</span>
      </div>
      <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
      {subtext && <p className="text-xs text-text-muted mt-0.5">{subtext}</p>}
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
    <div className="flex-1 text-center">
      <div className="text-lg font-bold text-text">{count}</div>
      <div className="text-[11px] text-text-muted mb-1">{label}</div>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${Math.max(pct, 5)}%` }}
        />
      </div>
      <div className="text-[10px] text-text-muted mt-0.5">{pct}%</div>
    </div>
  );
}
