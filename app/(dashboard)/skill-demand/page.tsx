"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Loader2,
  BarChart3,
  IndianRupee,
  AlertCircle,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

interface SkillDemandInfo {
  skill: string;
  demand_count: number;
  supply_count: number;
  demand_supply_ratio: number;
  trend: number;
  avg_salary: number | null;
  top_roles: string[];
  status: "hot" | "growing" | "stable" | "declining" | "oversaturated";
}

interface SkillDemandDashboard {
  trending_skills: SkillDemandInfo[];
  declining_skills: SkillDemandInfo[];
  highest_paying: SkillDemandInfo[];
  most_in_demand: SkillDemandInfo[];
  your_skills_analysis: SkillDemandInfo[];
}

const STATUS_STYLES: Record<string, { label: string; color: string; icon: typeof Flame }> = {
  hot: { label: "Hot", color: "text-red-600 bg-red-100", icon: Flame },
  growing: { label: "Growing", color: "text-green-600 bg-green-100", icon: TrendingUp },
  stable: { label: "Stable", color: "text-gray-600 bg-gray-100", icon: Minus },
  declining: { label: "Declining", color: "text-orange-600 bg-orange-100", icon: TrendingDown },
  oversaturated: { label: "Oversaturated", color: "text-yellow-600 bg-yellow-100", icon: AlertCircle },
};

function formatSalary(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  return amount.toLocaleString();
}

function SkillCard({ skill }: { skill: SkillDemandInfo }) {
  const status = STATUS_STYLES[skill.status] || STATUS_STYLES.stable;
  const StatusIcon = status.icon;

  return (
    <div className="rounded-lg border border-gray-200 bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-text capitalize">{skill.skill}</h4>
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <div className="text-text-muted">Demand</div>
          <div className="font-bold text-text">{skill.demand_count}</div>
        </div>
        <div>
          <div className="text-text-muted">Supply</div>
          <div className="font-bold text-text">{skill.supply_count}</div>
        </div>
        <div>
          <div className="text-text-muted">Trend</div>
          <div className={`font-bold flex items-center justify-center ${skill.trend > 0 ? "text-green-600" : skill.trend < 0 ? "text-red-600" : "text-gray-600"}`}>
            {skill.trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : skill.trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : null}
            {Math.abs(skill.trend)}%
          </div>
        </div>
      </div>

      {skill.avg_salary && skill.avg_salary > 0 && (
        <div className="mt-2 flex items-center gap-1 text-xs text-text-muted">
          <IndianRupee className="h-3 w-3" />
          Avg: {formatSalary(skill.avg_salary)}/yr
        </div>
      )}

      {skill.top_roles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {skill.top_roles.slice(0, 2).map((role) => (
            <span key={role} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-text-muted">
              {role}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillDemandPage() {
  const [data, setData] = useState<SkillDemandDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/skill-demand")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = data && (
    data.trending_skills.length > 0 ||
    data.most_in_demand.length > 0 ||
    data.highest_paying.length > 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Skill Demand Graph</h1>
        <p className="text-sm text-text-muted">
          Discover which skills are in demand, trending, and highest paying
        </p>
      </div>

      {!hasData ? (
        <div className="rounded-xl border border-gray-200 bg-card p-8 text-center">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <h3 className="font-medium text-text">No skill demand data yet</h3>
          <p className="mt-1 text-sm text-text-muted">
            Skill demand data is populated from job postings on the platform. As more jobs are posted, this dashboard will fill up with insights.
          </p>
        </div>
      ) : (
        <>
          {/* Your Skills Analysis */}
          {data!.your_skills_analysis.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text">
                <Zap className="h-5 w-5 text-primary" />
                Your Skills in the Market
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.your_skills_analysis.map((s) => (
                  <SkillCard key={s.skill} skill={s} />
                ))}
              </div>
            </div>
          )}

          {/* Most In Demand */}
          {data!.most_in_demand.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Most In Demand
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.most_in_demand.map((s) => (
                  <SkillCard key={s.skill} skill={s} />
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          {data!.trending_skills.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text">
                <Flame className="h-5 w-5 text-red-600" />
                Trending Up
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.trending_skills.map((s) => (
                  <SkillCard key={s.skill} skill={s} />
                ))}
              </div>
            </div>
          )}

          {/* Highest Paying */}
          {data!.highest_paying.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text">
                <IndianRupee className="h-5 w-5 text-emerald-600" />
                Highest Paying Skills
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.highest_paying.map((s) => (
                  <SkillCard key={s.skill} skill={s} />
                ))}
              </div>
            </div>
          )}

          {/* Declining */}
          {data!.declining_skills.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text">
                <TrendingDown className="h-5 w-5 text-orange-600" />
                Declining Demand
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data!.declining_skills.map((s) => (
                  <SkillCard key={s.skill} skill={s} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
