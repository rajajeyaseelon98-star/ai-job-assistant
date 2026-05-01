"use client";

import { Button } from "@/components/ui/Button";

type BatchItem = {
  applicationId: string;
  status: "success" | "skipped" | "failed";
  reason: string;
};

type BatchScreeningReportProps = {
  items: BatchItem[];
  onRetryFailed?: () => void;
};

export function BatchScreeningReport({ items, onRetryFailed }: BatchScreeningReportProps) {
  const failed = items.filter((item) => item.status === "failed");
  const skipped = items.filter((item) => item.status === "skipped");
  const success = items.filter((item) => item.status === "success");

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-text">Batch screening report</p>
      <p className="mt-1 text-xs text-text-muted">
        Success: {success.length} | Skipped: {skipped.length} | Failed: {failed.length}
      </p>
      <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.applicationId}
            className={`rounded-lg px-3 py-2 text-xs ${
              item.status === "success"
                ? "bg-emerald-50 text-emerald-800"
                : item.status === "skipped"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-rose-50 text-rose-800"
            }`}
          >
            {item.applicationId}: {item.reason}
          </div>
        ))}
      </div>
      {failed.length > 0 && onRetryFailed ? (
        <Button type="button" onClick={onRetryFailed} className="mt-3" variant="destructive">
          Retry failed items
        </Button>
      ) : null}
    </div>
  );
}
