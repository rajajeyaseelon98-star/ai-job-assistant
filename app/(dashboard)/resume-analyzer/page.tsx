"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResumeUpload } from "@/components/resume/ResumeUpload";
import { ResumeAnalysisResult } from "@/components/resume/ResumeAnalysisResult";
import { ImprovedResumeView, improvedToPlainText } from "@/components/resume/ImprovedResumeView";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { AIProgressIndicator } from "@/components/ui/AIProgressIndicator";
import type { ATSAnalysisResult } from "@/types/resume";
import type { ImprovedResumeContent } from "@/types/analysis";

function ResumeAnalyzerContent() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId");
  const improvedId = searchParams.get("improvedId");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ATSAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [improvedContent, setImprovedContent] = useState<ImprovedResumeContent | null>(null);
  const [improvedResumeId, setImprovedResumeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pastAnalysisLoading, setPastAnalysisLoading] = useState(!!analysisId);
  const [improvedLoading, setImprovedLoading] = useState(!!improvedId);
  const [improveJobTitle, setImproveJobTitle] = useState("");
  const [improveJobDescription, setImproveJobDescription] = useState("");
  const [recheckLoading, setRecheckLoading] = useState(false);
  // Snapshot of analysis that drove the current improvement (so Re-analyze button stays visible)
  const [analysisForRecheck, setAnalysisForRecheck] = useState<ATSAnalysisResult | null>(null);

  // Clear stale errors on mount so a previous "limit reached" doesn’t persist after changing plan
  useEffect(() => {
    setError(null);
    setImproveError(null);
  }, []);

  useEffect(() => {
    if (!analysisId) return;
    setPastAnalysisLoading(true);
    fetch(`/api/resume-analysis/${analysisId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.analysis_json) setAnalysis(data.analysis_json as ATSAnalysisResult);
        if (data?.resume_text != null) setResumeText(data.resume_text);
        if (data?.resume_id) setResumeId(data.resume_id);
      })
      .catch(() => {})
      .finally(() => setPastAnalysisLoading(false));
  }, [analysisId]);

  useEffect(() => {
    if (!improvedId) return;
    setImprovedLoading(true);
    setImprovedResumeId(improvedId);
    fetch(`/api/improved-resumes/${improvedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.improved_content) setImprovedContent(data.improved_content as ImprovedResumeContent);
      })
      .catch(() => {})
      .finally(() => setImprovedLoading(false));
  }, [improvedId]);

  function handleUploadComplete(data: { id: string; parsed_text: string | null }) {
    setResumeId(data.id);
    setResumeText(data.parsed_text ?? "");
    setAnalysis(null);
    setImprovedContent(null);
    setImprovedResumeId(null);
    setImproveError(null);
    setAnalysisForRecheck(null);
  }

  async function handleImproveResume() {
    setImproveError(null);
    if (!resumeText || (typeof resumeText === "string" && !resumeText.trim())) {
      setImproveError("Please paste or upload your resume text first.");
      return;
    }
    setImprovedContent(null);
    setImprovedResumeId(null);
    setImproving(true);
    try {
      const res = await fetch("/api/improve-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          resumeId: resumeId || undefined,
          jobTitle: improveJobTitle.trim() || undefined,
          jobDescription: improveJobDescription.trim() || undefined,
          previousAnalysis: analysis
            ? {
                atsScore: analysis.atsScore,
                missingSkills: analysis.missingSkills ?? [],
                resumeImprovements: analysis.resumeImprovements ?? [],
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImproveError(data.error || "Failed to improve resume");
        return;
      }
      const { improvedResumeId: id, ...contentOnly } = data;
      setImprovedContent(contentOnly as ImprovedResumeContent);
      if (typeof id === "string") setImprovedResumeId(id);
      if (analysis) setAnalysisForRecheck(analysis);
    } catch {
      setImproveError("Failed to improve resume");
    } finally {
      setImproving(false);
    }
  }

  async function handleRecheckImproved() {
    const prevAnalysis = analysisForRecheck ?? analysis;
    if (!improvedContent || !prevAnalysis) return;
    setError(null);
    setRecheckLoading(true);
    try {
      const improvedText = improvedToPlainText(improvedContent);
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: improvedText,
          recheckAfterImprovement: true,
          previousAnalysis: {
            atsScore: prevAnalysis.atsScore,
            missingSkills: prevAnalysis.missingSkills ?? [],
            resumeImprovements: prevAnalysis.resumeImprovements ?? [],
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error || "Re-check failed");
        setError(msg);
        return;
      }
      setAnalysis(data);
      setAnalysisForRecheck(data);
      dispatchUsageUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Re-check failed");
    } finally {
      setRecheckLoading(false);
    }
  }

  async function runAnalysis() {
    if (!resumeText) {
      setError("Upload a resume first or paste text.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          resumeId: resumeId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error || "Analysis failed");
        throw new Error(msg);
      }
      setAnalysis(data);
      dispatchUsageUpdated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Resume Analyzer</h1>
      {analysisId && analysis && (
        <p className="text-sm text-text-muted">Viewing past analysis from history.</p>
      )}

      {pastAnalysisLoading && (
        <p className="text-sm text-text-muted">Loading past analysis…</p>
      )}
      {improvedId && improvedLoading && (
        <p className="text-sm text-text-muted">Loading improved resume…</p>
      )}
      {improvedId && improvedContent && (
        <p className="text-sm text-text-muted">Viewing improved resume from history.</p>
      )}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-text">Upload resume</h2>
        <ResumeUpload onUploadComplete={handleUploadComplete} />
      </section>

      {resumeText && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text">Resume text</h2>
          <textarea
            className="w-full rounded-lg border border-gray-300 p-3 text-sm text-text"
            rows={6}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste or edit resume text…"
          />
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={runAnalysis}
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Analyze resume"}
            </button>
          </div>
          {loading && <div className="mt-3"><AIProgressIndicator message="Analyzing your resume…" /></div>}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>
      )}

      {analysis && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text">Resume analysis</h2>
          <ResumeAnalysisResult data={analysis} />
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-sm font-medium text-text">Optional: tailor for a specific job</p>
            <input
              type="text"
              placeholder="Job title (e.g. Frontend Developer)"
              value={improveJobTitle}
              onChange={(e) => setImproveJobTitle(e.target.value)}
              className="max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm text-text"
            />
            <textarea
              placeholder="Paste job description for better optimization (optional)"
              value={improveJobDescription}
              onChange={(e) => setImproveJobDescription(e.target.value)}
              rows={3}
              className="max-w-2xl rounded-lg border border-gray-300 p-3 text-sm text-text"
            />
            <button
              type="button"
              onClick={handleImproveResume}
              disabled={improving}
              className="w-fit rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {improving ? "AI generating improved resume…" : "Improve my resume"}
            </button>
            {improving && <AIProgressIndicator message="AI is rewriting your resume…" />}
            {improveError && (
              <p className="text-sm text-red-600">
                {improveError}
                {improveError.includes("Pro") && (
                  <> <Link href="/pricing" className="font-medium text-primary hover:underline">Upgrade to Pro</Link></>
                )}
              </p>
            )}
          </div>
        </section>
      )}

      {improvedContent && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text">Improved resume</h2>
          {(analysisForRecheck ?? analysis) && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="mb-3 text-sm font-medium text-text">
                Verify improvement — re-score against the same feedback you just fixed
              </p>
              <button
                type="button"
                onClick={handleRecheckImproved}
                disabled={recheckLoading}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {recheckLoading ? "Re-analyzing…" : "Re-analyze improved resume"}
              </button>
              <p className="mt-2 text-xs text-text-muted">
                Should show 90%+ if the improvements addressed the previous feedback.
              </p>
            </div>
          )}
          <ImprovedResumeView content={improvedContent} improvedResumeId={improvedResumeId ?? undefined} />
        </section>
      )}
    </div>
  );
}

export default function ResumeAnalyzerPage() {
  return (
    <Suspense fallback={<div className="space-y-8"><h1 className="text-2xl font-bold text-text">Resume Analyzer</h1><p className="text-text-muted">Loading…</p></div>}>
      <ResumeAnalyzerContent />
    </Suspense>
  );
}
