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
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between hover:bg-white hover:border-indigo-200 transition-all">
      <span className="text-xs font-bold text-slate-700 capitalize">{skill.skill}</span>
      <span className="text-xs font-medium text-indigo-600">{skill.demand_count}</span>
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

  const totalTrackedSkills = data
    ? [
        ...data.trending_skills,
        ...data.most_in_demand,
        ...data.highest_paying,
        ...data.declining_skills,
      ].length
    : 0;
  const hotSkillsCount = data
    ? [
        ...data.trending_skills,
        ...data.most_in_demand,
        ...data.highest_paying,
        ...data.declining_skills,
      ].filter((s) => s.status === "hot" || s.status === "growing").length
    : 0;
  const topMarketSalary =
    data && data.highest_paying.length > 0 && data.highest_paying[0].avg_salary
      ? formatSalary(data.highest_paying[0].avg_salary)
      : "N/A";

  return (
    <div className="max-w-5xl mx-auto w-full py-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Skill Demand Graph</h1>
        <p className="text-slate-500 text-base mt-2">
          Discover which skills are in demand, trending, and highest paying
        </p>
      </div>

      {/* At a glance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:border-indigo-100">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Tracked Skills</div>
          <div className="font-display text-2xl font-bold text-slate-900">{totalTrackedSkills}</div>
          <div className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-2">
            <TrendingUp className="h-3 w-3" /> Live market mapping
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:border-indigo-100">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Hot or Growing</div>
          <div className="font-display text-2xl font-bold text-slate-900">{hotSkillsCount}</div>
          <div className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-2">
            <ArrowUpRight className="h-3 w-3" /> Trending up
          </div>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all hover:border-indigo-100">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Top Market Salary</div>
          <div className="font-display text-2xl font-bold text-slate-900">{topMarketSalary}</div>
          <div className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-2">
            <IndianRupee className="h-3 w-3" /> Annual benchmark
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 min-h-[500px] flex flex-col relative">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Skill Demand Overview
            </h2>
            <div className="flex items-center gap-2">
              <button type="button" className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all">7D</button>
              <button type="button" className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all">30D</button>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
              <BarChart3 className="h-8 w-8" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900 mb-2">No skill demand data yet</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Skill demand data is populated from job postings on the platform. As more jobs are posted, this dashboard will fill up with insights.
            </p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-8 overflow-hidden relative">
              <div className="h-full w-[10%] bg-indigo-500 rounded-full" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 min-h-[500px] flex flex-col relative">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
            <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Skill Demand Overview
            </h2>
            <div className="flex items-center gap-2">
              <button type="button" className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all">7D</button>
              <button type="button" className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all">30D</button>
              <button type="button" className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all">90D</button>
            </div>
          </div>
          {/* Your Skills Analysis */}
          {data!.your_skills_analysis.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Your Skills in the Market
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {data!.your_skills_analysis.map((s) => (
                  <SkillCard key={s.skill} skill={s} />
                ))}
              </div>
            </div>
          )}

          {/* Most In Demand */}
          {data!.most_in_demand.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                Most In Demand
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {data!.most_in_demand.map((s) => (
                  <SkillCard key={s.skill} skill={s} />
                ))}
              </div>
            </div>
          )}

          {/* Trending */}
          {data!.trending_skills.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                Trending Up
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {data!.trending_skills.map((s) => (
                  <SkillCard key={s.skill} skill={s} />
                ))}
              </div>
            </div>
          )}

          {/* Highest Paying */}
          {data!.highest_paying.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
                <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                Highest Paying Skills
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {data!.highest_paying.map((s) => (
                  <SkillCard key={s.skill} skill={s} />
                ))}
              </div>
            </div>
          )}

          {/* Declining */}
          {data!.declining_skills.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg sm:text-xl font-semibold text-slate-900">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                Declining Demand
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                {data!.declining_skills.map((s) => (
                  <SkillCard key={s.skill} skill={s} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
