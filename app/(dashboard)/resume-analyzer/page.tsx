"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ResumeUpload } from "@/components/resume/ResumeUpload";
import { ResumeAnalysisResult } from "@/components/resume/ResumeAnalysisResult";
import { ImprovedResumeView, improvedToPlainText } from "@/components/resume/ImprovedResumeView";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { AIProgressIndicator } from "@/components/ui/AIProgressIndicator";
import { UpgradeBanner } from "@/components/ui/UpgradeBanner";
import type { ATSAnalysisResult } from "@/types/resume";
import type { ImprovedResumeContent } from "@/types/analysis";
import { humanizeImproveResumeError, humanizeNetworkError } from "@/lib/friendlyApiError";

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
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number } | null>(null);
  // Snapshot of analysis that drove the current improvement (so Re-analyze button stays visible)
  const [analysisForRecheck, setAnalysisForRecheck] = useState<ATSAnalysisResult | null>(null);
  /** How to improve resume when job fields are used: pivot to target job vs polish current path */
  const [tailorIntent, setTailorIntent] = useState<"target_job" | "optimize_current">("target_job");
  /** Upload file vs paste text — paste is visible without uploading */
  const [resumeInputMode, setResumeInputMode] = useState<"upload" | "paste">("upload");

  // Clear stale errors on mount so a previous "limit reached" doesn’t persist after changing plan
  useEffect(() => {
    setError(null);
    setImproveError(null);
  }, []);

  // Quick Resume Builder → open in analyzer
  useEffect(() => {
    if (analysisId || improvedId) return;
    try {
      const draft = sessionStorage.getItem("resumeBuilderDraft");
      if (!draft) return;
      setResumeText(draft);
      setResumeInputMode("paste");
      setResumeId(null);
      sessionStorage.removeItem("resumeBuilderDraft");
    } catch {
      /* ignore */
    }
  }, [analysisId, improvedId]);

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
    setResumeInputMode("upload");
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
          tailorIntent:
            improveJobTitle.trim() || improveJobDescription.trim()
              ? tailorIntent
              : undefined,
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
        setImproveError(humanizeImproveResumeError(typeof data.error === "string" ? data.error : undefined));
        return;
      }
      const { improvedResumeId: id, ...contentOnly } = data;
      setImprovedContent(contentOnly as ImprovedResumeContent);
      if (typeof id === "string") setImprovedResumeId(id);
      if (analysis) setAnalysisForRecheck(analysis);
    } catch {
      setImproveError(humanizeNetworkError());
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
      setError(e instanceof Error ? humanizeImproveResumeError(e.message) : humanizeNetworkError());
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
        const msg = data.detail
          ? `${typeof data.error === "string" ? data.error : "Error"}: ${data.detail}`
          : typeof data.error === "string"
            ? data.error
            : "Analysis failed";
        throw new Error(msg);
      }
      setAnalysis(data);
      // Track usage for upgrade banner
      if (data._usage) {
        setUsageInfo({ used: data._usage.used, limit: data._usage.limit });
      }
      dispatchUsageUpdated();
    } catch (e) {
      setError(
        e instanceof Error ? humanizeImproveResumeError(e.message) : humanizeImproveResumeError(undefined)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Resume Analyzer</h1>

      {/* Smart upgrade trigger */}
      {usageInfo && usageInfo.limit > 0 && (
        <UpgradeBanner feature="resume analyses" usedCount={usageInfo.used} limit={usageInfo.limit} />
      )}
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
        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Add your resume</h2>
        <p className="mb-3 text-sm text-text-muted">
          Upload a file or paste text — both work for ATS analysis.
        </p>
        <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-card p-1">
          <button
            type="button"
            onClick={() => setResumeInputMode("upload")}
            className={`min-h-[44px] flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4 ${
              resumeInputMode === "upload"
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:bg-gray-50"
            }`}
          >
            Upload PDF / DOCX
          </button>
          <button
            type="button"
            onClick={() => {
              setResumeInputMode("paste");
              if (resumeText === null) setResumeText("");
            }}
            className={`min-h-[44px] flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4 ${
              resumeInputMode === "paste"
                ? "bg-primary text-white shadow-sm"
                : "text-text-muted hover:bg-gray-50"
            }`}
          >
            Paste resume text
          </button>
        </div>
        {resumeInputMode === "upload" ? (
          <ResumeUpload onUploadComplete={handleUploadComplete} />
        ) : (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-lg border border-gray-300 p-3 text-base sm:text-sm text-text min-h-[180px]"
              rows={10}
              value={resumeText ?? ""}
              onChange={(e) => {
                setResumeText(e.target.value);
                setResumeId(null);
              }}
              placeholder="Paste your full resume here (no upload needed)…"
            />
            <p className="text-xs text-text-muted">
              Tip: paste from Word, Google Docs, or any text source. Then analyze below.
            </p>
          </div>
        )}
      </section>

      {resumeText != null && resumeText !== "" && (
        <section>
          {resumeInputMode === "upload" && (
            <>
              <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Resume text</h2>
              <textarea
                className="w-full rounded-lg border border-gray-300 p-3 text-base sm:text-sm text-text min-h-[44px]"
                rows={6}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste or edit resume text…"
              />
            </>
          )}
          {resumeInputMode === "paste" && (
            <h2 className="mb-3 text-base sm:text-lg font-semibold text-text">Ready to analyze</h2>
          )}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={runAnalysis}
              disabled={loading}
              className="w-full sm:w-auto min-h-[44px] rounded-lg bg-primary px-4 py-2 font-medium text-sm sm:text-base text-white hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
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
          <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Resume analysis</h2>
          <ResumeAnalysisResult data={analysis} />
          <div className="mt-4 sm:mt-6 flex flex-col gap-3">
            <p className="text-xs sm:text-sm font-medium text-text">Optional: tailor for a specific job</p>
            {(improveJobTitle.trim() || improveJobDescription.trim()) && (
              <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50/80 p-3 sm:p-4">
                <p className="text-xs font-medium text-text">How should we use the job info?</p>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
                  <input
                    type="radio"
                    name="tailorIntent"
                    checked={tailorIntent === "target_job"}
                    onChange={() => setTailorIntent("target_job")}
                    className="mt-1"
                  />
                  <span>
                    <strong>Tailor for this job</strong> — align resume to this role (ok for career change).
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
                  <input
                    type="radio"
                    name="tailorIntent"
                    checked={tailorIntent === "optimize_current"}
                    onChange={() => setTailorIntent("optimize_current")}
                    className="mt-1"
                  />
                  <span>
                    <strong>Polish my current path</strong> — improve wording for your field; job text is only a hint.
                  </span>
                </label>
              </div>
            )}
            <input
              type="text"
              placeholder="Job title (e.g. Frontend Developer)"
              value={improveJobTitle}
              onChange={(e) => setImproveJobTitle(e.target.value)}
              className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm text-text min-h-[44px]"
            />
            <textarea
              placeholder="Paste job description for better optimization (optional)"
              value={improveJobDescription}
              onChange={(e) => setImproveJobDescription(e.target.value)}
              rows={3}
              className="w-full max-w-2xl rounded-lg border border-gray-300 p-3 text-base sm:text-sm text-text min-h-[44px]"
            />
            <button
              type="button"
              onClick={handleImproveResume}
              disabled={improving}
              className="w-full sm:w-fit min-h-[44px] rounded-lg bg-primary px-4 py-2 font-medium text-sm sm:text-base text-white hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
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
          <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Improved resume</h2>
          {(analysisForRecheck ?? analysis) && (
            <div className="mb-4 rounded-lg border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 p-4 sm:p-5">
              <p className="mb-1 text-sm font-semibold text-text">Next step</p>
              <p className="mb-3 text-sm text-text-muted">
                See your new ATS score after the improvements.
              </p>
              <button
                type="button"
                onClick={handleRecheckImproved}
                disabled={recheckLoading}
                className="w-full sm:w-auto min-h-[48px] rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
              >
                {recheckLoading ? "Scoring your improved resume…" : "See your new ATS score →"}
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
    <Suspense fallback={<div className="space-y-4 sm:space-y-6 md:space-y-8"><h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Resume Analyzer</h1><p className="text-text-muted">Loading…</p></div>}>
      <ResumeAnalyzerContent />
    </Suspense>
  );
}
