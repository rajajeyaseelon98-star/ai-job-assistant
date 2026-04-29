"use client";

type RealtimeHealthBadgeProps = {
  connected: boolean | null;
  delayed?: boolean;
};

export function RealtimeHealthBadge({ connected, delayed = false }: RealtimeHealthBadgeProps) {
  const label =
    connected == null
      ? "Checking…"
      : connected
        ? delayed
          ? "Connected (degraded)"
          : "Connected"
        : "Disconnected";
  const classes =
    connected == null
      ? "border-slate-200 bg-slate-50 text-slate-600"
      : connected
        ? delayed
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classes}`}>
      {label}
    </span>
  );
}
