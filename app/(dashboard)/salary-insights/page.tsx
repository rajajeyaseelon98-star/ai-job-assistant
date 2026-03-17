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

interface SalaryInsight {
  job_title: string;
  location: string | null;
  experience_range: string;
  salary_range: { min: number; max: number; avg: number };
  currency: string;
  data_points: number;
  percentiles: { p25: number; p50: number; p75: number };
  trend: "rising" | "stable" | "declining";
  comparable_roles: Array<{ title: string; avg_salary: number }>;
}

function formatSalary(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString();
}

export default function SalaryInsightsPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [insight, setInsight] = useState<SalaryInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!jobTitle.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ title: jobTitle });
      if (location) params.set("location", location);
      if (experience) params.set("experience", experience);

      const res = await fetch(`/api/salary-intelligence?${params}`);
      if (res.ok) {
        setInsight(await res.json());
      }
    } catch {
      // Ignore
    }
    setLoading(false);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Salary Intelligence</h1>
        <p className="text-sm text-text-muted">
          Research salary ranges, trends, and comparisons for any role
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="rounded-xl border border-gray-200 bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-text">Job Title</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Software Engineer, Data Scientist"
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Bangalore"
                className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Experience</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
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
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search Salaries
        </button>
      </form>

      {/* Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!loading && searched && insight && (
        <div className="space-y-6">
          {/* Salary Range Card */}
          <div className="rounded-xl border border-gray-200 bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text">{insight.job_title}</h2>
              <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
                <TrendIcon className="h-4 w-4" />
                {insight.trend === "rising" ? "Rising" : insight.trend === "declining" ? "Declining" : "Stable"}
              </div>
            </div>
            {insight.location && (
              <p className="mt-1 text-sm text-text-muted flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {insight.location}
              </p>
            )}
            <p className="text-xs text-text-muted mt-1">
              {insight.experience_range} | {insight.data_points} data points
            </p>

            {insight.salary_range.avg > 0 ? (
              <>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-text-muted">Minimum</div>
                    <div className="text-xl font-bold text-text flex items-center justify-center">
                      <IndianRupee className="h-4 w-4" />
                      {formatSalary(insight.salary_range.min)}
                    </div>
                  </div>
                  <div className="border-x border-gray-200">
                    <div className="text-sm text-text-muted">Average</div>
                    <div className="text-2xl font-bold text-primary flex items-center justify-center">
                      <IndianRupee className="h-5 w-5" />
                      {formatSalary(insight.salary_range.avg)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-text-muted">Maximum</div>
                    <div className="text-xl font-bold text-text flex items-center justify-center">
                      <IndianRupee className="h-4 w-4" />
                      {formatSalary(insight.salary_range.max)}
                    </div>
                  </div>
                </div>

                {/* Percentile Bar */}
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-medium text-text">Salary Distribution</h3>
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
                  <div className="mt-1 flex justify-between text-xs text-text-muted">
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
            <div className="rounded-xl border border-gray-200 bg-card p-6">
              <h3 className="mb-4 font-semibold text-text flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Comparable Roles
              </h3>
              <div className="space-y-3">
                {insight.comparable_roles.map((role) => (
                  <div
                    key={role.title}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-text">{role.title}</span>
                    <span className="text-sm font-bold text-text flex items-center">
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
    </div>
  );
}
