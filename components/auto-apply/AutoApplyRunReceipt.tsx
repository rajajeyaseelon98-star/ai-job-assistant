"use client";

type AutoApplyRunReceiptProps = {
  appliedCount: number;
  skippedCount: number;
  failedCount: number;
};

export function AutoApplyRunReceipt({
  appliedCount,
  skippedCount,
  failedCount,
}: AutoApplyRunReceiptProps) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-900">Auto-apply run completed</p>
      <p className="mt-1 text-sm text-emerald-800">
        Applied: {appliedCount} | Skipped: {skippedCount} | Failed: {failedCount}
      </p>
    </div>
  );
}
