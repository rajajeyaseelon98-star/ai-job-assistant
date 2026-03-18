"use client";

import { useState } from "react";
import { Loader2, BarChart3, CheckCircle, XCircle, ArrowRight } from "lucide-react";

interface SkillGapResult {
  matching_skills: string[];
  missing_skills: string[];
  transferable_skills: string[];
  recommendations: string[];
  gap_score: number;
}

export default function SkillGapPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [error, setError] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobId, setJobId] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [mode, setMode] = useState<"application" | "manual">("application");

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const body = mode === "application"
        ? { application_id: applicationId.trim() }
        : { resume_text: resumeText.trim(), job_id: jobId.trim() };

      if (mode === "application" && !applicationId.trim()) { setError("Application ID required"); setLoading(false); return; }
      if (mode === "manual" && (!resumeText.trim() || !jobId.trim())) { setError("Both resume text and job ID required"); setLoading(false); return; }

      const res = await fetch("/api/recruiter/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setResult(await res.json());
      } else {
        const data = await res.json();
        setError(data.error || "Analysis failed");
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">AI Skill Gap Report</h1>
      <p className="text-sm text-text-muted">Analyze how a candidate&#39;s skills match against job requirements.</p>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setMode("application")}
          className={`rounded-lg px-4 py-2 text-sm font-medium min-h-[44px] sm:min-h-0 ${mode === "application" ? "bg-primary text-white" : "border border-gray-300 text-text active:bg-gray-100"}`}>
          By Application ID
        </button>
        <button onClick={() => setMode("manual")}
          className={`rounded-lg px-4 py-2 text-sm font-medium min-h-[44px] sm:min-h-0 ${mode === "manual" ? "bg-primary text-white" : "border border-gray-300 text-text active:bg-gray-100"}`}>
          Manual Input
        </button>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-3 sm:space-y-4 rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
        {mode === "application" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Application ID *</label>
            <input type="text" value={applicationId} onChange={(e) => setApplicationId(e.target.value)}
              placeholder="Paste application UUID..."
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Job Posting ID *</label>
              <input type="text" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job UUID..."
                className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Resume Text *</label>
              <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={6}
                placeholder="Paste candidate's resume text..."
                className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none" />
            </div>
          </>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 min-h-[44px] w-full sm:w-auto">
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
