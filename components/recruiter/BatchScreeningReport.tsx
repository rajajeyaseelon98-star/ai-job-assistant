"use client";

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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">Batch screening report</p>
      <p className="mt-1 text-xs text-slate-600">
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
        <button
          type="button"
          onClick={onRetryFailed}
          className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
        >
          Retry failed items
        </button>
      ) : null}
    </div>
  );
}
