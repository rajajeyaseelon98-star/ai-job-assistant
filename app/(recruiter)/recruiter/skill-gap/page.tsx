"use client";

import { useState } from "react";
import { Loader2, BarChart3, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import {
  useRecruiterSkillGap,
  type RecruiterSkillGapResult,
} from "@/hooks/queries/use-recruiter";
import { formatApiFetchThrownError } from "@/lib/api-error";

export default function SkillGapPage() {
  const skillGapMut = useRecruiterSkillGap();
  const loading = skillGapMut.isPending;
  const [result, setResult] = useState<RecruiterSkillGapResult | null>(null);
  const [error, setError] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobId, setJobId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [mode, setMode] = useState<"application" | "manual">("application");

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const body =
      mode === "application"
        ? { application_id: applicationId.trim() }
        : { resume_text: resumeText.trim(), job_id: jobId.trim() };

    if (mode === "application" && !applicationId.trim()) {
      setError("Application ID required");
      return;
    }
    if (mode === "manual" && (!resumeText.trim() || !jobId.trim())) {
      setError("Both resume text and job ID required");
      return;
    }

    try {
      const data = await skillGapMut.mutateAsync(body);
      setResult(data);
    } catch (e) {
      setError(formatApiFetchThrownError(e) || "Something went wrong");
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-8">
      <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">AI Skill Gap Report</h1>
      <p className="text-sm text-slate-500">Analyze how a candidate&#39;s skills match against job requirements.</p>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setMode("application")}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium ${mode === "application" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          By Application ID
        </button>
        <button onClick={() => setMode("manual")}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium ${mode === "manual" ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          Manual Input
        </button>
      </div>

      <form onSubmit={handleAnalyze} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 space-y-6">
        {mode === "application" ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Application ID *</label>
            <input type="text" value={applicationId} onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Paste application UUID..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Job Posting ID *</label>
              <input type="text" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job UUID..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Resume Text *</label>
              <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={6}
                placeholder="Paste candidate's resume text..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800" />
            </div>
          </>
        )}

        {error && <p className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-8 py-3.5 font-medium disabled:opacity-50 w-full md:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          {loading ? "Analyzing..." : "Analyze Skill Gap"}
        </button>
      </form>

      {result && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4 rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${
              result.gap_score >= 80 ? "bg-green-500" : result.gap_score >= 50 ? "bg-yellow-500" : "bg-red-500"
            }`}>
              {result.gap_score}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold text-text">Fit Score</p>
              <p className="text-sm text-text-muted">
                {result.gap_score >= 80 ? "Excellent match" : result.gap_score >= 50 ? "Moderate match - some gaps" : "Significant skill gaps"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 sm:p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-800">
                <CheckCircle className="h-4 w-4" /> Matching Skills ({result.matching_skills.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {result.matching_skills.map((s) => (
                  <span key={s} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">{s}</span>
                ))}
                {result.matching_skills.length === 0 && <p className="text-xs text-green-600">None identified</p>}
              </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-3 sm:p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
                <XCircle className="h-4 w-4" /> Missing Skills ({result.missing_skills.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {result.missing_skills.map((s) => (
                  <span key={s} className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{s}</span>
                ))}
                {result.missing_skills.length === 0 && <p className="text-xs text-red-600">None identified</p>}
              </div>
            </div>
          </div>

          {result.transferable_skills.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-800">
                <ArrowRight className="h-4 w-4" /> Transferable Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {result.transferable_skills.map((s) => (
                  <span key={s} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{s}</span>
                ))}
              </div>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
              <h3 className="mb-3 text-sm font-semibold text-text">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-text-muted">&bull; {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
