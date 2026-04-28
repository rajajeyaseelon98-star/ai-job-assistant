"use client";

import { useState, lazy, Suspense } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { useApplications, useDeleteApplication, useUpdateApplicationStatus, applicationKeys } from "@/hooks/queries/use-applications";
import type { Application, ApplicationStatus } from "@/types/application";
import { STATUS_LABELS } from "@/types/application";
import { ListSkeleton, SectionSkeleton } from "@/components/ui/SectionSkeleton";
import { RecruiterJobApplicationsPanel } from "@/components/applications/RecruiterJobApplicationsPanel";

const ApplicationForm = lazy(() =>
  import("@/components/applications/ApplicationForm").then((m) => ({ default: m.ApplicationForm }))
);
const ApplicationBoard = lazy(() =>
  import("@/components/applications/ApplicationBoard").then((m) => ({ default: m.ApplicationBoard }))
);

export default function ApplicationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const queryClient = useQueryClient();
  const { data: applications = [], isLoading: loading } = useApplications();
  const deleteMutation = useDeleteApplication();
  const updateStatusMutation = useUpdateApplicationStatus();

  function handleSave(app: Application) {
    queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
    } catch { /* mutation error handled by React Query */ }
  }

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    try {
      await updateStatusMutation.mutateAsync({ id, status });
    } catch { /* mutation error handled by React Query */ }
  }

  const filtered =
    filterStatus === "all"
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  // Stats
  const stats = {
    total: applications.length,
    saved: applications.filter((a) => a.status === "saved").length,
    applied: applications.filter((a) => a.status === "applied").length,
    interviewing: applications.filter((a) => a.status === "interviewing").length,
    offers: applications.filter((a) => a.status === "offer").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };
  const inPipeline = stats.applied + stats.interviewing + stats.offers + stats.rejected;
  const toInterviewPct =
    inPipeline > 0
      ? Math.round(((stats.interviewing + stats.offers) / inPipeline) * 100)
      : null;

  return (
    <div className="max-w-[1600px] mx-auto w-full py-8 px-4 sm:px-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Application Tracker</h1>
          <p className="mt-1 text-sm sm:text-base text-text-muted">
            Kanban pipeline: Saved → Applied → Interview → Offer (or Rejected). Drag cards between columns on desktop &amp; mobile board view.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total },
          { label: "Saved", value: stats.saved },
          { label: "Applied", value: stats.applied },
          { label: "Interview", value: stats.interviewing },
          { label: "Offers", value: stats.offers },
          { label: "Rejected", value: stats.rejected },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 text-center transition-all hover:shadow-md"
          >
            <span className="block font-display text-2xl font-bold text-indigo-600">{s.value}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{s.label}</span>
          </div>
        ))}
      </div>
      {inPipeline > 0 && toInterviewPct !== null && (
        <p className="text-xs sm:text-sm text-text-muted">
          <span className="font-medium text-foreground">Conversion:</span>{" "}
          {toInterviewPct}% of non-saved applications reached interview or offer stage.
        </p>
      )}

      {/* Form — lazy loaded */}
      {(showForm || editing) && (
        <Suspense fallback={<SectionSkeleton height="h-48" />}>
          <ApplicationForm
            initial={editing || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </Suspense>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field min-h-[44px] py-2 sm:min-h-0 sm:py-1.5"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5 shadow-sm">
          <button
            type="button"
            onClick={() => setView("board")}
            className={`rounded-md p-1.5 transition-colors duration-200 ${view === "board" ? "bg-primary/10 text-primary shadow-sm" : "text-text-muted hover:bg-surface-muted hover:text-foreground"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`rounded-md p-1.5 transition-colors duration-200 ${view === "list" ? "bg-primary/10 text-primary shadow-sm" : "text-text-muted hover:bg-surface-muted hover:text-foreground"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Board/List — lazy loaded */}
      {loading ? (
        <ListSkeleton rows={4} />
      ) : (
        <Suspense fallback={<ListSkeleton rows={4} />}>
          <ApplicationBoard
            applications={filtered}
            view={view}
            onEdit={(app) => {
              setEditing(app);
              setShowForm(false);
            }}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </Suspense>
      )}

      <RecruiterJobApplicationsPanel />
    </div>
  );
}
