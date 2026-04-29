"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Download,
  Loader2,
  Mail,
  MapPin,
  User,
  FileText,
  BarChart3,
  Eye,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import type { ATSAnalysisResult } from "@/types/resume";
import {
  useRecruiterCandidateDetail,
  useRecruiterResumeAnalyze,
  useRecruiterResumeSignedUrl,
} from "@/hooks/queries/use-recruiter";
import { formatApiFetchThrownError } from "@/lib/api-error";
import { toAiUiError } from "@/lib/client-ai-error";
import { AICreditExhaustedAlert } from "@/components/ui/AICreditExhaustedAlert";
import { InlineRetryCard } from "@/components/ui/InlineRetryCard";
import { ActionStatusBanner } from "@/components/ui/ActionStatusBanner";

type ResumeAnalysisRow = {
  id: string;
  score: number;
  analysis_json: unknown;
  created_at: string;
};

type ResumeRow = {
  id: string;
  parsed_text: string | null;
  file_url: string | null;
  created_at: string;
  resume_analysis?: ResumeAnalysisRow[] | ResumeAnalysisRow | null;
};

type CandidateDetail = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  resumes: ResumeRow[] | null;
  user_preferences: {
    experience_level: string | null;
    preferred_role: string | null;
    preferred_location: string | null;
    salary_expectation: string | null;
  } | null;
};

function normalizeAnalysis(
  raw: ResumeRow["resume_analysis"]
): ResumeAnalysisRow | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    const sorted = [...raw].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0] ?? null;
  }
  return raw as ResumeAnalysisRow;
}

function looksLikePdf(fileUrl: string | null): boolean {
  if (!fileUrl) return false;
  return fileUrl.toLowerCase().includes(".pdf");
}

export default function CandidateProfilePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const {
    data: rawData,
    isLoading: loading,
    isError,
    error: loadError,
  } = useRecruiterCandidateDetail(id);
  const downloadUrlMut = useRecruiterResumeSignedUrl();
  const previewUrlMut = useRecruiterResumeSignedUrl();
  const analyzeMut = useRecruiterResumeAnalyze();

  const data = useMemo((): CandidateDetail | null => {
    if (!rawData) return null;
    const json = rawData as CandidateDetail & {
      user_preferences?: CandidateDetail["user_preferences"] | CandidateDetail["user_preferences"][];
    };
    const prefsRaw = json.user_preferences;
    const user_preferences = Array.isArray(prefsRaw) ? prefsRaw[0] ?? null : prefsRaw ?? null;
    return { ...(json as CandidateDetail), user_preferences };
  }, [rawData]);

  const error =
    isError && loadError ? formatApiFetchThrownError(loadError) : null;

  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
  const [analyzeCreditError, setAnalyzeCreditError] = useState(false);
  const [resumeActionError, setResumeActionError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  async function downloadResume(resumeId: string) {
    setResumeActionError(null);
    try {
      const { url } = await downloadUrlMut.mutateAsync(resumeId);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setResumeActionError(formatApiFetchThrownError(e));
    }
  }

  async function togglePreview(resumeId: string, _fileUrl: string | null) {
    if (previewResumeId === resumeId) {
      setPreviewResumeId(null);
      setPreviewUrl(null);
      return;
    }
    setPreviewUrl(null);
    setResumeActionError(null);
    try {
      const { url } = await previewUrlMut.mutateAsync(resumeId);
      if (url) {
        setPreviewResumeId(resumeId);
        setPreviewUrl(url);
      }
    } catch (e) {
      setResumeActionError(formatApiFetchThrownError(e));
    }
  }

  async function runRecruiterAts(resumeId: string) {
    setAnalyzeMessage(null);
    setAnalyzeCreditError(false);
    try {
      await analyzeMut.mutateAsync({ resumeId, candidateId: id });
      setAnalyzeMessage("Analysis saved.");
      setTimeout(() => setAnalyzeMessage(null), 4000);
    } catch (e) {
      const ui = toAiUiError(e);
      setAnalyzeMessage(ui.message || "Request failed.");
      setAnalyzeCreditError(ui.isCreditsExhausted);
    }
  }

  const downloadingId =
    downloadUrlMut.isPending && typeof downloadUrlMut.variables === "string"
      ? downloadUrlMut.variables
      : null;
  const previewLoadingId =
    previewUrlMut.isPending && typeof previewUrlMut.variables === "string"
      ? previewUrlMut.variables
      : null;
  const analyzingId =
    analyzeMut.isPending && analyzeMut.variables
      ? analyzeMut.variables.resumeId
      : null;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span>Loading profile…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <p className="text-red-600">{error || "Not found"}</p>
        <Link
          href="/recruiter/candidates"
          className="mt-6 inline-flex items-center gap-2 text-indigo-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to candidate search
        </Link>
      </div>
    );
  }

  const prefs = data.user_preferences;
  const resumes = Array.isArray(data.resumes) ? data.resumes : [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/recruiter/candidates"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Candidate search
      </Link>

      {analyzeMessage && (
        analyzeMessage.startsWith("Analysis saved") ? (
          <p
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="status"
          >
            {analyzeMessage}
          </p>
        ) : analyzeCreditError ? (
          <div className="mb-4">
            <AICreditExhaustedAlert message={analyzeMessage} pricingHref="/recruiter/pricing" />
          </div>
        ) : (
          <p
            className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            {analyzeMessage}
          </p>
        )
      )}
      {resumeActionError ? (
        <div className="mb-4">
          <InlineRetryCard
            message={resumeActionError}
            onRetry={() => setResumeActionError(null)}
            retryLabel="Dismiss"
            alternateHref={`/recruiter/messages?compose=1&receiver_id=${encodeURIComponent(data.id)}`}
            alternateLabel="Message candidate"
          />
        </div>
      ) : null}

      {/* Header */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-50/80 to-white px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                <User className="h-8 w-8 text-indigo-500" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {data.name || "Candidate"}
                </h1>
                <a
                  href={`mailto:${data.email}`}
                  className="mt-1 flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  {data.email}
                </a>
                <p className="mt-2 text-xs text-slate-500">
                  Member since {new Date(data.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/recruiter/messages?compose=1&receiver_id=${encodeURIComponent(data.id)}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    Message in app
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(data.id).then(() => {
                        setCopiedId(true);
                        setTimeout(() => setCopiedId(false), 2000);
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {copiedId ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copiedId ? "Copied" : "Copy user ID"}
                  </button>
                </div>
              </div>
            </div>
            {resumes.length === 0 && (
              <span className="self-start rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200/80">
                No resume on file
              </span>
            )}
          </div>

          {prefs && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {prefs.experience_level && (
                <div className="flex items-start gap-2 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-slate-200/60">
                  <Briefcase className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Experience</p>
                    <p className="capitalize text-slate-800">{prefs.experience_level}</p>
                  </div>
                </div>
              )}
              {prefs.preferred_location && (
                <div className="flex items-start gap-2 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-slate-200/60">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Location</p>
                    <p className="text-slate-800">{prefs.preferred_location}</p>
                  </div>
                </div>
              )}
              {prefs.preferred_role && (
                <div className="flex items-start gap-2 rounded-xl bg-white/80 px-4 py-3 ring-1 ring-slate-200/60">
                  <FileText className="mt-0.5 h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Preferred role</p>
                    <p className="text-slate-800">{prefs.preferred_role}</p>
                  </div>
                </div>
              )}
              {prefs.salary_expectation && (
                <div className="rounded-xl bg-white/80 px-4 py-3 ring-1 ring-slate-200/60">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Salary expectation</p>
                  <p className="text-slate-800">{prefs.salary_expectation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resumes + analysis */}
        <div className="space-y-6 px-6 py-8 sm:px-10">
          {resumes.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              This candidate has not uploaded a resume yet.
            </p>
          ) : (
            resumes.map((resume, idx) => {
              const analysis = normalizeAnalysis(resume.resume_analysis);
              const parsed = analysis?.analysis_json as ATSAnalysisResult | undefined;
              const atsScore = analysis?.score ?? parsed?.atsScore;

              return (
                <div
                  key={resume.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-slate-900">
                          Resume {resumes.length > 1 ? `#${idx + 1}` : ""}
                        </h2>
                        <p className="text-xs text-slate-500">
                          Added {new Date(resume.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {resume.file_url && (
                        <>
                          <button
                            type="button"
                            onClick={() => downloadResume(resume.id)}
                            disabled={downloadingId === resume.id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {downloadingId === resume.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            Download
                          </button>
                          <button
                            type="button"
                            onClick={() => togglePreview(resume.id, resume.file_url)}
                            disabled={previewLoadingId === resume.id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            {previewLoadingId === resume.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            {previewResumeId === resume.id ? "Hide preview" : "Preview"}
                          </button>
                        </>
                      )}
                      {resume.parsed_text && resume.parsed_text.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => runRecruiterAts(resume.id)}
                          disabled={analyzingId === resume.id}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-100 disabled:opacity-50"
                        >
                          {analyzingId === resume.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Run ATS analysis
                        </button>
                      )}
                    </div>
                  </div>
                  {analyzingId === resume.id ? (
                    <div className="mt-3">
                      <ActionStatusBanner kind="warning" message="Running ATS analysis and saving report..." />
                    </div>
                  ) : null}

                  {previewResumeId === resume.id && previewUrl && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      {looksLikePdf(resume.file_url) ? (
                        <iframe
                          title="Resume PDF preview"
                          src={previewUrl}
                          className="h-[min(70vh,720px)] w-full bg-white"
                          sandbox="allow-scripts allow-same-origin allow-popups"
                        />
                      ) : (
                        <div className="p-6 text-center text-sm text-slate-600">
                          <p className="mb-3">In-browser preview works best for PDFs. Open the file in a new tab instead.</p>
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-indigo-600 hover:underline"
                          >
                            Open file
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {analysis && (
                    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center gap-2 text-slate-800">
                        <BarChart3 className="h-4 w-4 text-indigo-600" />
                        <span className="text-sm font-semibold">ATS analysis</span>
                        {typeof atsScore === "number" && (
                          <span className="ml-auto rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                            {atsScore}%
                          </span>
                        )}
                      </div>
                      {parsed?.missingSkills && parsed.missingSkills.length > 0 && (
                        <div className="mb-3">
                          <p className="mb-1 text-xs font-medium text-slate-500">Skills gap</p>
                          <div className="flex flex-wrap gap-1.5">
                            {parsed.missingSkills.slice(0, 12).map((s) => (
                              <span
                                key={s}
                                className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-900"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {parsed?.resumeImprovements && parsed.resumeImprovements.length > 0 && (
                        <div className="mb-3">
                          <p className="mb-1 text-xs font-medium text-slate-500">Improvements</p>
                          <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                            {parsed.resumeImprovements.slice(0, 5).map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {parsed?.recommendedRoles && parsed.recommendedRoles.length > 0 && (
                        <div>
                          <p className="mb-1 text-xs font-medium text-slate-500">Suggested roles</p>
                          <p className="text-sm text-slate-700">{parsed.recommendedRoles.slice(0, 5).join(" · ")}</p>
                        </div>
                      )}
                      {!parsed && analysis.analysis_json != null ? (
                        <pre className="max-h-48 overflow-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-700">
                          {JSON.stringify(analysis.analysis_json, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  )}

                  {resume.parsed_text && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Extracted text</p>
                      <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
                        {resume.parsed_text.slice(0, 8000)}
                        {resume.parsed_text.length > 8000 ? "…" : ""}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
