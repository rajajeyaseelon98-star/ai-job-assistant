"use client";

import { useMemo } from "react";
import { useAiFeatureBreakdown, useAiUsageHistory, useAiUsageSummary } from "@/hooks/queries/use-ai-usage";
import { UsageHealthChip } from "@/components/usage/UsageHealthChip";
import { InlineRetryCard } from "@/components/ui/InlineRetryCard";

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(Math.max(0, Math.round(n)));
}

function formatCurrency(n: number, currency: "USD" | "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(n || 0);
}

export function AiUsageDashboard() {
  const summary = useAiUsageSummary();
  const history = useAiUsageHistory(50);
  const breakdown = useAiFeatureBreakdown();

  const creditPercent = useMemo(() => {
    const total = summary.data?.totalCreditsAvailable ?? 0;
    if (total <= 0) return 0;
    return Math.min(100, Math.round(((summary.data?.usedCredits ?? 0) / total) * 100));
  }, [summary.data?.totalCreditsAvailable, summary.data?.usedCredits]);

  const hasAnyError = !!(summary.error || history.error || breakdown.error);
  const generatedAt =
    summary.data?.meta?.generatedAt || history.data?.meta?.generatedAt || breakdown.data?.meta?.generatedAt;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">AI Usage Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Token, credit, and feature-level AI usage for your account.</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <UsageHealthChip healthy={!hasAnyError} detail={generatedAt ? `Generated ${new Date(generatedAt).toLocaleString()}` : "Waiting for data"} />
          {generatedAt ? <span className="text-xs text-slate-500">Last refresh: {new Date(generatedAt).toLocaleTimeString()}</span> : null}
        </div>
      </header>

      {hasAnyError ? (
        <InlineRetryCard
          message={`Usage metrics load failed: ${
            (summary.error as Error | undefined)?.message ||
            (history.error as Error | undefined)?.message ||
            (breakdown.error as Error | undefined)?.message ||
            "Unknown error"
          }`}
          onRetry={() => {
            void summary.refetch();
            void history.refetch();
            void breakdown.refetch();
          }}
          retryLabel="Retry usage fetch"
          alternateHref="/pricing"
          alternateLabel="Open pricing"
        />
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Total Tokens</p>
          <p className="mt-1 text-2xl font-semibold">{formatNumber(summary.data?.totalTokens ?? 0)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Total Credits Used</p>
          <p className="mt-1 text-2xl font-semibold">{formatNumber(summary.data?.totalCredits ?? 0)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Most Used Feature</p>
          <p className="mt-1 text-xl font-semibold">{summary.data?.mostUsedFeature ?? "-"}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Estimated Cost</p>
          <p className="mt-1 text-base font-semibold">
            {formatCurrency(summary.data?.totalCostUsd ?? 0, "USD")} / {formatCurrency(summary.data?.totalCostInr ?? 0, "INR")}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Credit Balance</h2>
          <span className="text-sm text-slate-600">
            {formatNumber(summary.data?.usedCredits ?? 0)} / {formatNumber(summary.data?.totalCreditsAvailable ?? 0)}
          </span>
        </div>
        <div className="h-2 w-full rounded bg-slate-100">
          <div className="h-2 rounded bg-indigo-500" style={{ width: `${creditPercent}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Remaining credits: <span className="font-medium">{formatNumber(summary.data?.remainingCredits ?? 0)}</span>
        </p>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Feature Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Feature</th>
                <th className="py-2">Calls</th>
                <th className="py-2">Tokens</th>
                <th className="py-2">Credits</th>
                <th className="py-2">Cost (USD)</th>
              </tr>
            </thead>
            <tbody>
              {(breakdown.data?.rows ?? []).map((row) => (
                <tr key={row.feature_name} className="border-b last:border-b-0">
                  <td className="py-2">{row.feature_name}</td>
                  <td className="py-2">{formatNumber(row.calls)}</td>
                  <td className="py-2">{formatNumber(row.total_tokens)}</td>
                  <td className="py-2">{formatNumber(row.total_credits)}</td>
                  <td className="py-2">{formatCurrency(row.total_cost_usd, "USD")}</td>
                </tr>
              ))}
              {(!breakdown.data?.rows || breakdown.data.rows.length === 0) && (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={5}>
                    No usage data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold">Usage History (Latest 50)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="py-2">Date</th>
                <th className="py-2">Feature</th>
                <th className="py-2">Tokens</th>
                <th className="py-2">Credits</th>
                <th className="py-2">Cache</th>
              </tr>
            </thead>
            <tbody>
              {(history.data?.rows ?? []).map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="py-2">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="py-2">{row.feature_name}</td>
                  <td className="py-2">{formatNumber(row.total_tokens)}</td>
                  <td className="py-2">{formatNumber(row.credits_used)}</td>
                  <td className="py-2">{row.cache_hit ? "hit" : "miss"}</td>
                </tr>
              ))}
              {(!history.data?.rows || history.data.rows.length === 0) && (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={5}>
                    No usage history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {(summary.isLoading || history.isLoading || breakdown.isLoading) && (
        <p className="text-sm text-slate-500">Loading usage metrics...</p>
      )}
    </div>
  );
}
