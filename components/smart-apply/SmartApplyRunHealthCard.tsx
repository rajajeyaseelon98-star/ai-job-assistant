"use client";

type SmartApplyRunHealthCardProps = {
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  reasonCode?: string | null;
};

export function SmartApplyRunHealthCard({
  lastRunAt,
  nextRunAt,
  reasonCode,
}: SmartApplyRunHealthCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">Smart Apply run health</p>
      <p className="mt-2 text-xs text-slate-600">
        Last run: {lastRunAt ? new Date(lastRunAt).toLocaleString() : "Not run yet"}
      </p>
      <p className="mt-1 text-xs text-slate-600">
        Next run: {nextRunAt ? new Date(nextRunAt).toLocaleString() : "Not scheduled"}
      </p>
      <p className="mt-1 text-xs text-slate-600">Last outcome reason: {reasonCode ?? "N/A"}</p>
    </div>
  );
}
