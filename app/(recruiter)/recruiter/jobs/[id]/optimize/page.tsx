"use client";

import { useState } from "react";
import { use } from "react";
import { Loader2, Wand2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimizeRecruiterJob, usePatchRecruiterJob } from "@/hooks/queries/use-recruiter";
import { useRecruiterJob } from "@/hooks/queries/use-recruiter";
import { toAiUiError } from "@/lib/client-ai-error";
import { AICreditExhaustedAlert } from "@/components/ui/AICreditExhaustedAlert";
import { InlineRetryCard } from "@/components/ui/InlineRetryCard";
import { ActionReceiptCard } from "@/components/ui/ActionReceiptCard";

interface OptimizeResult {
  suggestions: string[];
  optimized_title?: string;
  optimized_description?: string;
  score: number;
}

export default function OptimizeJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: originalJob } = useRecruiterJob(id);
  const optimizeMut = useOptimizeRecruiterJob();
  const patchMut = usePatchRecruiterJob();
  const loading = optimizeMut.isPending;
  const applying = patchMut.isPending;
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState("");
  const [isCreditError, setIsCreditError] = useState(false);
  const [applied, setApplied] = useState(false);

  async function handleOptimize() {
    setError("");
    setIsCreditError(false);
    try {
      const data = await optimizeMut.mutateAsync(id);
      setResult(data);
    } catch (e) {
      const ui = toAiUiError(e);
      setError(ui.message || "Something went wrong");
      setIsCreditError(ui.isCreditsExhausted);
    }
  }

  async function applyOptimizations() {
    if (!result) return;
    setError("");
    setIsCreditError(false);
    try {
      const updates: Record<string, string> = {};
      if (result.optimized_title) updates.title = result.optimized_title;
      if (result.optimized_description) updates.description = result.optimized_description;

      await patchMut.mutateAsync({ id, body: updates });
      setApplied(true);
    } catch (e) {
      const ui = toAiUiError(e);
      setError(ui.message || "Failed to apply changes");
      setIsCreditError(ui.isCreditsExhausted);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-text-muted hover:text-text min-h-[44px]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">AI Job Post Optimization</h1>
      <p className="text-sm text-text-muted">Analyze your job posting for clarity, inclusivity, SEO, and attractiveness.</p>

      {!result && (
        <button onClick={handleOptimize} disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 min-h-[44px] w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? "Analyzing..." : "Analyze & Optimize"}
        </button>
      )}

      {error && (
        isCreditError ? (
          <AICreditExhaustedAlert message={error} pricingHref="/recruiter/pricing" />
        ) : (
          <InlineRetryCard
            message={error}
            onRetry={() => void (result ? applyOptimizations() : handleOptimize())}
            retryLabel="Retry"
            alternateHref={`/recruiter/jobs/${id}`}
            alternateLabel="Back to job"
          />
        )
      )}
      {applied ? (
        <ActionReceiptCard
          title="Optimizations applied"
          description="Your job post was updated with AI suggestions."
          primaryHref={`/recruiter/jobs/${id}`}
          primaryLabel="Review edited job"
          secondaryHref="/recruiter/jobs"
          secondaryLabel="Back to jobs"
        />
      ) : null}

      {result && (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${
              result.score >= 80 ? "bg-green-500" : result.score >= 60 ? "bg-yellow-500" : "bg-red-500"
            }`}>
              {result.score}
            </div>
            <div>
              <p className="text-lg font-semibold text-text">Optimization Score</p>
              <p className="text-sm text-text-muted">
                {result.score >= 80 ? "Great job posting!" : result.score >= 60 ? "Room for improvement" : "Needs significant optimization"}
              </p>
            </div>
          </div>

          {result.suggestions.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-text">Suggestions</h3>
              <div className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-card p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                    <p className="text-sm text-text">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.optimized_title && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-text">Optimized Title</h3>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-800">{result.optimized_title}</p>
              </div>
              {typeof (originalJob as Record<string, unknown> | null)?.title === "string" ? (
                <p className="mt-1 text-xs text-slate-500">
                  Before: {String((originalJob as Record<string, unknown>).title)}
                </p>
              ) : null}
            </div>
          )}

          {result.optimized_description && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-text">Optimized Description</h3>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="whitespace-pre-wrap text-sm text-green-800">{result.optimized_description}</p>
              </div>
              {typeof (originalJob as Record<string, unknown> | null)?.description === "string" ? (
                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-slate-600">Before</p>
                  <p className="whitespace-pre-wrap text-xs text-slate-700">
                    {String((originalJob as Record<string, unknown>).description).slice(0, 800)}
                  </p>
                </div>
              ) : null}
            </div>
          )}

          {(result.optimized_title || result.optimized_description) && (
            <button onClick={applyOptimizations} disabled={applying}
              className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 active:bg-green-800 disabled:opacity-50 min-h-[44px] w-full sm:w-auto">
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Apply Optimizations
            </button>
          )}

          <button onClick={() => setResult(null)} className="text-sm text-text-muted underline hover:text-text">
            Run again
          </button>
        </div>
      )}
    </div>
  );
}
