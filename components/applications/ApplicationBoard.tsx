"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Pencil,
  Trash2,
  MapPin,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Application, ApplicationStatus } from "@/types/application";
import { STATUS_LABELS } from "@/types/application";

interface ApplicationBoardProps {
  applications: Application[];
  view: "board" | "list";
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

const BOARD_COLUMNS: ApplicationStatus[] = ["saved", "applied", "interviewing", "offer", "rejected"];
const DOT_COLORS: Record<ApplicationStatus, string> = {
  saved: "bg-slate-400",
  applied: "bg-blue-500",
  interviewing: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-rose-500",
  withdrawn: "bg-gray-400",
};

function ApplicationCard({
  app,
  onEdit,
  onDelete,
  onStatusChange,
  showStatus,
  draggable,
}: {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  showStatus?: boolean;
  draggable?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      draggable={!!draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("applicationId", app.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group relative bg-white border border-slate-200 shadow-sm rounded-xl p-4 mb-3 transition-all hover:border-indigo-300 hover:shadow-md ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="mb-1 font-display text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{app.role}</h4>
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-2 truncate">{app.company}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 flex gap-1" onDragStart={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onEdit(app)} className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-slate-50 flex items-center justify-center">
            <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(app.id)} className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-slate-50 flex items-center justify-center">
            <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
        {showStatus && (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/50">
            {STATUS_LABELS[app.status]}
          </span>
        )}
        {app.location && (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/50 gap-1">
            <MapPin className="h-3 w-3" /> {app.location}
          </span>
        )}
        {app.salary && (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/50 gap-1">
            <DollarSign className="h-3 w-3" /> {app.salary}
          </span>
        )}
        {app.applied_date && (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/50 gap-1">
            <Calendar className="h-3 w-3" /> {new Date(app.applied_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {(app.notes || app.url) && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline active:opacity-70 min-h-[44px] sm:min-h-0"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Less" : "More"}
        </button>
      )}

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {app.notes && <p className="text-xs text-text-muted break-words">{app.notes}</p>}
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline active:opacity-70 min-h-[44px] sm:min-h-0"
            >
              <ExternalLink className="h-3 w-3" /> View listing
            </a>
          )}
          <select
            value={app.status}
            onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
            onDragStart={(e) => e.stopPropagation()}
            className="w-full min-h-[44px] sm:min-h-0 rounded-lg border border-border bg-surface-muted px-2 py-1 text-xs text-text transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export function ApplicationBoard({
  applications,
  view,
  onEdit,
  onDelete,
  onStatusChange,
}: ApplicationBoardProps) {
  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center shadow-card sm:px-8">
        <p className="text-sm font-medium text-foreground">No applications yet</p>
        <p className="mt-2 text-sm text-text-muted">
          Add one above, or get applications from{" "}
          <Link href="/auto-apply" className="font-medium text-primary hover:underline">
            AI Auto-Apply
          </Link>
          .
        </p>
        <p className="mt-4 text-xs text-text-muted">
          Tip: polish your resume first in{" "}
          <Link href="/resume-analyzer" className="text-primary hover:underline">
            Resume Analyzer
          </Link>{" "}
          for better response rates.
        </p>
      </div>
    );
  }

  if (view === "board") {
    return (
      <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 min-h-[70vh]">
        {/* Mobile: stacked cards grouped by status */}
        <div className="space-y-4 md:hidden">
          {BOARD_COLUMNS.map((status) => {
            const items = applications.filter((a) => a.status === status);
            return (
              <div key={status} className="flex-1 min-w-[300px] max-w-[350px] flex flex-col">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-transparent z-10">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${DOT_COLORS[status]}`} />
                    <span className="font-display text-sm font-bold text-slate-700">{STATUS_LABELS[status]}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("applicationId");
                    if (id) onStatusChange(id, status);
                  }}
                  className="min-h-[72px] space-y-2 rounded-xl"
                >
                  {items.length === 0 ? (
                    <p className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-[11px] text-slate-400 font-medium">Drop cards here</p>
                  ) : (
                    items.map((app) => (
                      <ApplicationCard
                        key={app.id}
                        app={app}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                        draggable
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: horizontal kanban columns */}
        <div className="hidden md:flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {BOARD_COLUMNS.map((status) => {
            const items = applications.filter((a) => a.status === status);
            return (
              <div key={status} className="flex-1 min-w-[300px] max-w-[350px] flex flex-col">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-transparent z-10">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${DOT_COLORS[status]}`} />
                    <span className="font-display text-sm font-bold text-slate-700">{STATUS_LABELS[status]}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("applicationId");
                    if (id) onStatusChange(id, status);
                  }}
                  className="min-h-[120px] space-y-2 rounded-xl"
                >
                  {items.length === 0 && (
                    <p className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-[11px] text-slate-400 font-medium">Drag applications here</p>
                  )}
                  {items.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      app={app}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      draggable
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-2">
      {applications.map((app) => (
        <ApplicationCard
          key={app.id}
          app={app}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          showStatus
        />
      ))}
    </div>
  );
}
