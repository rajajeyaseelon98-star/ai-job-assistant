"use client";

import { useState } from "react";
import { Loader2, IndianRupee, TrendingUp } from "lucide-react";
import {
  useRecruiterSalaryEstimate,
  type RecruiterSalaryEstimateResult,
} from "@/hooks/queries/use-recruiter";
import { formatApiFetchThrownError } from "@/lib/api-error";

export default function SalaryEstimatorPage() {
  const estimateMut = useRecruiterSalaryEstimate();
  const loading = estimateMut.isPending;
  const [result, setResult] = useState<RecruiterSalaryEstimateResult | null>(null);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("3");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("onsite");

  async function handleEstimate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Job title is required");
      return;
    }
    setError("");
    try {
      const data = await estimateMut.mutateAsync({
        title: title.trim(),
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience_years: parseInt(experience) || 3,
        location: location.trim() || "India",
        work_type: workType,
      });
      setResult(data);
    } catch (e) {
      setError(formatApiFetchThrownError(e) || "Something went wrong");
    }
  }

  function formatSalary(val: number) {
    if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return String(val);
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-8">
      <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">AI Salary Estimator</h1>
      <p className="text-sm text-slate-500">Get competitive salary estimates for any role based on skills, experience, and location.</p>

      <form onSubmit={handleEstimate} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Job Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Senior React Developer"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Key Skills</label>
          <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Experience (years)</label>
            <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} min="0" max="30"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Bangalore"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Work Type</label>
            <select value={workType} onChange={(e) => setWorkType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800">
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        {error && <p className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-8 py-3.5 font-medium disabled:opacity-50 w-full md:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <IndianRupee className="h-4 w-4" />}
          {loading ? "Estimating..." : "Estimate Salary"}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Salary Range ({result.currency})</h3>
            <div className="grid gap-3 sm:gap-4 grid-cols-3">
              <div className="text-center">
                <p className="text-xs text-slate-500">Minimum</p>
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">{formatSalary(result.min)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Median</p>
                <p className="text-xl font-bold text-indigo-600 sm:text-2xl">{formatSalary(result.median)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Maximum</p>
                <p className="text-xl font-bold text-slate-900 sm:text-2xl">{formatSalary(result.max)}</p>
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
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TrendingUp className="h-4 w-4" /> Key Factors
              </h3>
              <ul className="space-y-1.5">
                {result.factors.map((f, i) => (
                  <li key={i} className="text-sm text-slate-600">&bull; {f}</li>
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
