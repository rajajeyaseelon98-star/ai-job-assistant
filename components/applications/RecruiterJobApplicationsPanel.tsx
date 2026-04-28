"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Briefcase } from "lucide-react";
import { useMyJobApplications, type RecruiterJobApplicationRow } from "@/hooks/queries/use-job-applications";
import { InlineRetryCard } from "@/components/ui/InlineRetryCard";
import { toUiFeedback } from "@/lib/ui-feedback";

function stageLabel(stage: string) {
  const s = stage.toLowerCase();
  if (s === "applied") return "Applied";
  if (s === "shortlisted") return "Shortlisted";
  if (s === "interview_scheduled") return "Interview scheduled";
  if (s === "interviewed") return "Interviewed";
  if (s === "offer_sent") return "Offer sent";
  if (s === "hired") return "Hired";
  if (s === "rejected") return "Rejected";
  return stage;
}

function Row({ row }: { row: RecruiterJobApplicationRow }) {
  const [open, setOpen] = useState(false);
  const title = row.job?.title || "Job";
  const companyName = row.company?.name || "Company";
  const updatedAt = row.updated_at || row.created_at;
  const events = row.events || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
          <p className="mt-0.5 text-xs text-slate-500 truncate">{companyName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
              {stageLabel(String(row.stage || ""))}
            </span>
            <span className="text-slate-500">
              Updated {new Date(String(updatedAt)).toLocaleString()}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Timeline
        </button>
      </div>

      {open ? (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          {events.length ? (
            events.slice(0, 8).map((e, idx) => (
              <div key={idx} className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  {String((e as Record<string, unknown>).event_type || "event")}
                </span>
                {String((e as Record<string, unknown>).to_stage || "") ? (
                  <span>
                    {" "}
                    → {stageLabel(String((e as Record<string, unknown>).to_stage))}
                  </span>
                ) : null}
                <span className="text-slate-400">
                  {" "}
                  · {new Date(String((e as Record<string, unknown>).created_at)).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No timeline events yet.</p>
          )}
          <div className="pt-1">
            <Link
              href="/messages"
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Message recruiter
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function RecruiterJobApplicationsPanel() {
  const q = useMyJobApplications(50);
  const rows = q.data || [];

  if (q.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Loading recruiter applications…</p>
      </div>
    );
  }

  if (q.error) {
    const f = toUiFeedback(q.error);
    return (
      <InlineRetryCard
        message={f.message}
        retryLabel="Retry"
        onRetry={() => void q.refetch()}
      />
    );
  }

  if (!rows.length) return null;

  return (
    <section className="mt-6 space-y-3">
      <div className="flex items-center gap-2">
        <Briefcase className="h-5 w-5 text-indigo-600" />
        <h2 className="font-display text-lg font-bold text-slate-900">
          Applications to recruiter-posted jobs
        </h2>
      </div>
      <p className="text-sm text-slate-600">
        Track status updates from recruiters (shortlisted, interview, offer). This is separate from your manual
        application tracker.
      </p>
      <div className="space-y-3">
        {rows.slice(0, 8).map((r) => (
          <Row key={r.id} row={r} />
        ))}
      </div>
    </section>
  );
}

