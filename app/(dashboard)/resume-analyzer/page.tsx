"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResumeUpload } from "@/components/resume/ResumeUpload";
import { ResumeAnalysisResult } from "@/components/resume/ResumeAnalysisResult";
import type { ATSAnalysisResult } from "@/types/resume";

function ResumeAnalyzerContent() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ATSAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastAnalysisLoading, setPastAnalysisLoading] = useState(!!analysisId);

  useEffect(() => {
    if (!analysisId) return;
    setPastAnalysisLoading(true);
    fetch(`/api/resume-analysis/${analysisId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.analysis_json) setAnalysis(data.analysis_json as ATSAnalysisResult);
      })
      .catch(() => {})
      .finally(() => setPastAnalysisLoading(false));
  }, [analysisId]);

  function handleUploadComplete(data: { id: string; parsed_text: string | null }) {
    setResumeId(data.id);
    setResumeText(data.parsed_text ?? "");
    setAnalysis(null);
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
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </section>
      )}

      {analysis && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text">Resume analysis</h2>
          <ResumeAnalysisResult data={analysis} />
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
