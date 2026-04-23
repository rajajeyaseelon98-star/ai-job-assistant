"use client";

import { useState } from "react";
import { use } from "react";
import { Loader2, Zap, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAutoShortlistRecruiterJob } from "@/hooks/queries/use-recruiter";
import { toAiUiError } from "@/lib/client-ai-error";
import { AICreditExhaustedAlert } from "@/components/ui/AICreditExhaustedAlert";

export default function AutoShortlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const shortlistMut = useAutoShortlistRecruiterJob();
  const loading = shortlistMut.isPending;
  const [result, setResult] = useState<{ shortlisted: number; total_screened: number } | null>(null);
  const [error, setError] = useState("");
  const [isCreditError, setIsCreditError] = useState(false);

  async function handleAutoShortlist() {
    setError("");
    setIsCreditError(false);
    try {
      const data = await shortlistMut.mutateAsync(id);
      setResult(data);
    } catch (e) {
      const ui = toAiUiError(e);
      setError(ui.message || "Something went wrong");
      setIsCreditError(ui.isCreditsExhausted);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-text-muted hover:text-text min-h-[44px]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">AI Auto-Shortlisting</h1>
      <p className="text-sm text-text-muted">
        Automatically screen all unreviewed applications for this job. AI will score each candidate
        and shortlist the best matches.
      </p>

      {!result && (
        <button onClick={handleAutoShortlist} disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 min-h-[44px] w-full sm:w-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {loading ? "Screening Candidates..." : "Start Auto-Shortlisting"}
        </button>
      )}

      {error && (
        isCreditError ? (
          <AICreditExhaustedAlert message={error} pricingHref="/recruiter/pricing" />
        ) : (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )
      )}

      {result && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 sm:p-6 text-center">
          <Zap className="mx-auto h-8 w-8 text-green-600" />
          <p className="mt-3 text-lg font-semibold text-green-800">Screening Complete!</p>
          <p className="mt-1 text-sm text-green-700">
            Screened <strong>{result.total_screened}</strong> application{result.total_screened !== 1 ? "s" : ""}
            {" "}&mdash; <strong>{result.shortlisted}</strong> shortlisted
          </p>
          <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
            <button onClick={() => router.push("/recruiter/applications")}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 active:bg-green-800 min-h-[44px] w-full sm:w-auto">
              View Applications
            </button>
            <button onClick={() => { setResult(null); setError(""); }}
              className="rounded-lg border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-100 active:bg-green-200 min-h-[44px] w-full sm:w-auto">
              Run Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
