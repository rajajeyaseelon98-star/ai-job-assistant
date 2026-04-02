"use client";

import { useState } from "react";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Loader2,
  BarChart3,
  MapPin,
  Briefcase,
} from "lucide-react";
import {
  useSalaryIntelligenceSearch,
  type SalaryInsight,
} from "@/hooks/mutations/use-salary-intelligence";
import { formatApiFetchThrownError } from "@/lib/api-error";

function formatSalary(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString();
}

export default function SalaryInsightsPage() {
  const searchMut = useSalaryIntelligenceSearch();
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [insight, setInsight] = useState<SalaryInsight | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searched, setSearched] = useState(false);
  const loading = searchMut.isPending;

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    setSearched(true);
    setSearchError("");
    try {
      const data = await searchMut.mutateAsync({
        title: jobTitle,
        location: location || undefined,
        experience: experience || undefined,
      });
      setInsight(data);
    } catch (e) {
      setInsight(null);
      setSearchError(formatApiFetchThrownError(e));
    }
  }

  const TrendIcon = insight?.trend === "rising"
    ? TrendingUp
    : insight?.trend === "declining"
      ? TrendingDown
      : Minus;

  const trendColor = insight?.trend === "rising"
    ? "text-green-600"
    : insight?.trend === "declining"
      ? "text-red-600"
      : "text-gray-600";

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">Salary Intelligence</h1>
        <p className="text-slate-500 text-base mb-8 leading-relaxed">
          Research salary ranges, trends, and comparisons for any role
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Job Title</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer, Data Scientist"
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangalore"
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl pl-10 pr-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Experience</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
            >
              <option value="">Any</option>
              <option value="0">0-2 years</option>
              <option value="3">2-5 years</option>
              <option value="7">5-10 years</option>
              <option value="12">10+ years</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !jobTitle.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-8 py-3.5 font-medium transition-all w-full md:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search Salaries
        </button>
      </form>

      {searchError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{searchError}</p>
      ) : null}

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!loading && searched && insight && (
        <div className="mt-12 pt-12 border-t border-slate-200 space-y-4 sm:space-y-6">
          <h2 className="font-display text-2xl font-bold text-slate-900 mb-6">Salary Insights</h2>
          {/* Salary Range Card */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">{insight.job_title}</h2>
              <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                {insight.trend === "rising" ? "Rising" : insight.trend === "declining" ? "Declining" : "Stable"}
              </div>
            </div>
            {insight.location && (
              <p className="mt-1 text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {insight.location}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              {insight.experience_range} | {insight.data_points} data points
            </p>

            {insight.salary_range.avg > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 mt-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-100 transition-all text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Low</div>
                    <div className="font-display text-2xl font-bold text-indigo-600 flex items-center justify-center">
                      <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
                      {formatSalary(insight.salary_range.min)}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-100 transition-all text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Median</div>
                    <div className="font-display text-2xl font-bold text-indigo-600 flex items-center justify-center">
                      <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
                      {formatSalary(insight.salary_range.avg)}
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-indigo-100 transition-all text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">High</div>
                    <div className="font-display text-2xl font-bold text-indigo-600 flex items-center justify-center">
                      <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4" />
                      {formatSalary(insight.salary_range.max)}
                    </div>
                  </div>
                </div>

                {/* Percentile Bar */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mb-8">
                  <h3 className="font-display text-lg font-bold text-slate-900 mb-6">Salary Distribution</h3>
                  <div className="relative h-8 w-full rounded-full bg-gray-100">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-primary/20"
                      style={{ width: "100%" }}
                    />
                    <div
                      className="absolute top-0 h-full rounded-full bg-primary/40"
                      style={{
                        left: "25%",
                        width: "50%",
                      }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-4 w-0.5 bg-primary"
                      style={{ left: "50%" }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>P25: {formatSalary(insight.percentiles.p25)}</span>
                    <span>P50: {formatSalary(insight.percentiles.p50)}</span>
                    <span>P75: {formatSalary(insight.percentiles.p75)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                <p>No salary data available yet for this role. Data is built from job postings on the platform.</p>
              </div>
            )}
          </div>

          {/* Comparable Roles */}
          {insight.comparable_roles.length > 0 && (
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 mb-8">
              <h3 className="font-display text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                Comparable Roles
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {insight.comparable_roles.map((role) => (
                  <div
                    key={role.title}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-100"
                  >
                    <span className="text-sm font-medium text-slate-700 truncate">{role.title}</span>
                    <span className="text-sm font-bold text-slate-900 flex items-center">
                      <IndianRupee className="h-3 w-3" />
                      {formatSalary(role.avg_salary)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && searched && !insight && (
        <div className="rounded-xl border border-gray-200 bg-card p-8 text-center">
          <IndianRupee className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <h3 className="font-medium text-text">No results found</h3>
          <p className="mt-1 text-sm text-text-muted">
            Try a different job title or broader search terms.
          </p>
        </div>
      )}

      {!loading && !searched && (
        <div className="max-w-md mx-auto text-center py-20 px-6">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <IndianRupee className="h-8 w-8" />
          </div>
          <p className="text-slate-400 text-sm italic">
            Search a role, location, and experience level to generate salary intelligence.
          </p>
        </div>
      )}
    </div>
  );
}
