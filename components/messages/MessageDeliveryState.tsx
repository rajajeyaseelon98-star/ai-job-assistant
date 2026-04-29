"use client";

type MessageDeliveryStateProps = {
  state: "sending" | "sent" | "read" | "failed";
  detail?: string;
};

const labelMap: Record<MessageDeliveryStateProps["state"], string> = {
  sending: "Sending",
  sent: "Sent",
  read: "Read",
  failed: "Failed",
};

const toneMap: Record<MessageDeliveryStateProps["state"], string> = {
  sending: "border-slate-200 bg-slate-50 text-slate-700",
  sent: "border-indigo-200 bg-indigo-50 text-indigo-700",
  read: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
};

export function MessageDeliveryState({ state, detail }: MessageDeliveryStateProps) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${toneMap[state]}`}>
      <p className="font-semibold">{labelMap[state]}</p>
      {detail ? <p className="mt-0.5">{detail}</p> : null}
    </div>
  );
}
