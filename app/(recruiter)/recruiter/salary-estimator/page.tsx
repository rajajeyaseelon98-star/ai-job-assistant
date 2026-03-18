"use client";

import { useState } from "react";
import { Loader2, IndianRupee, TrendingUp } from "lucide-react";

interface SalaryResult {
  min: number;
  max: number;
  median: number;
  currency: string;
  factors: string[];
  market_insight: string;
}

export default function SalaryEstimatorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SalaryResult | null>(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("3");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("onsite");

  async function handleEstimate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Job title is required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recruiter/salary-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          experience_years: parseInt(experience) || 3,
          location: location.trim() || "India",
          work_type: workType,
        }),
      });
      if (res.ok) {
        setResult(await res.json());
      } else {
        const data = await res.json();
        setError(data.error || "Estimation failed");
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  function formatSalary(val: number) {
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return String(val);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">AI Salary Estimator</h1>
      <p className="text-sm text-text-muted">Get competitive salary estimates for any role based on skills, experience, and location.</p>

      <form onSubmit={handleEstimate} className="space-y-3 sm:space-y-4 rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Job Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Senior React Developer"
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Key Skills</label>
          <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js..."
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
        </div>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Experience (years)</label>
            <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} min="0" max="30"
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Bangalore"
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Work Type</label>
            <select value={workType} onChange={(e) => setWorkType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]">
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 min-h-[44px] w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
          {loading ? "Estimating..." : "Estimate Salary"}
        </button>
      </form>

      {result && (
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 lg:p-6">
            <h3 className="mb-3 sm:mb-4 text-sm font-semibold text-text">Salary Range ({result.currency})</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-3">
              <div className="text-center">
                <p className="text-xs text-text-muted">Minimum</p>
                <p className="text-xl font-bold text-text sm:text-2xl">{formatSalary(result.min)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted">Median</p>
                <p className="text-xl font-bold text-primary sm:text-2xl">{formatSalary(result.median)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted">Maximum</p>
                <p className="text-xl font-bold text-text sm:text-2xl">{formatSalary(result.max)}</p>
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="flex h-full">
                <div className="bg-blue-200" style={{ width: "30%" }} />
                <div className="bg-primary" style={{ width: "40%" }} />
                <div className="bg-blue-200" style={{ width: "30%" }} />
              </div>
            </div>
          </div>

          {result.factors.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                <TrendingUp className="h-4 w-4" /> Key Factors
              </h3>
              <ul className="space-y-1.5">
                {result.factors.map((f, i) => (
                  <li key={i} className="text-sm text-text-muted">&bull; {f}</li>
                ))}
              </ul>
            </div>
          )}

          {result.market_insight && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4 md:p-5">
              <h3 className="mb-2 text-sm font-semibold text-blue-800">Market Insight</h3>
              <p className="text-sm text-blue-700">{result.market_insight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
