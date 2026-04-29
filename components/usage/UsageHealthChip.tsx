"use client";

type UsageHealthChipProps = {
  healthy: boolean;
  detail?: string;
};

export function UsageHealthChip({ healthy, detail }: UsageHealthChipProps) {
  return (
    <div
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        healthy
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`}
    >
      {healthy ? "Tracking healthy" : "Tracking degraded"}
      {detail ? <span className="ml-2 font-normal">{detail}</span> : null}
    </div>
  );
}
