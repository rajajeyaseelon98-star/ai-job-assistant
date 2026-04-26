"use client";

type ActionStatusBannerProps = {
  kind: "success" | "warning" | "error";
  message: string;
  requestId?: string;
};

const styles: Record<ActionStatusBannerProps["kind"], string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-rose-200 bg-rose-50 text-rose-800",
};

export function ActionStatusBanner({ kind, message, requestId }: ActionStatusBannerProps) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[kind]}`}>
      <p>{message}</p>
      {requestId ? <p className="mt-1 text-xs opacity-80">Ref: {requestId}</p> : null}
    </div>
  );
}
