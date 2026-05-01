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
  saved: "bg-border",
  applied: "bg-blue-500",
  interviewing: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-rose-500",
  withdrawn: "bg-border",
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
      className={`group relative mb-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="mb-1 truncate font-display text-sm font-bold text-text transition-colors group-hover:text-primary">
            {app.role}
          </h4>
          <p className="mb-3 flex items-center gap-2 truncate text-xs text-text-muted">{app.company}</p>
        </div>
        <div
          className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
          onDragStart={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onEdit(app)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-primary"
            aria-label="Edit application"
          >
            <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(app.id)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-primary"
            aria-label="Delete application"
          >
            <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-3 mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
        {showStatus && (
          <span className="inline-flex items-center rounded border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text-muted">
            {STATUS_LABELS[app.status]}
          </span>
        )}
        {app.location && (
          <span className="inline-flex items-center gap-1 rounded border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text-muted">
            <MapPin className="h-3 w-3" /> {app.location}
          </span>
        )}
        {app.salary && (
          <span className="inline-flex items-center gap-1 rounded border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text-muted">
            <DollarSign className="h-3 w-3" /> {app.salary}
          </span>
        )}
        {app.applied_date && (
          <span className="inline-flex items-center gap-1 rounded border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text-muted">
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
      <div className="min-h-[70vh] rounded-3xl border border-border bg-surface-muted/60 p-4 sm:p-6">
        {/* Mobile: stacked cards grouped by status */}
        <div className="space-y-4 md:hidden">
          {BOARD_COLUMNS.map((status) => {
            const items = applications.filter((a) => a.status === status);
            return (
              <div key={status} className="flex flex-col">
                <div className="sticky top-0 z-10 mb-3 flex items-center justify-between bg-transparent">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${DOT_COLORS[status]}`} />
                    <span className="font-display text-sm font-bold text-text">{STATUS_LABELS[status]}</span>
                  </div>
                  <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-bold text-text-muted">
                    {items.length}
                  </span>
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
                    <p className="rounded-xl border-2 border-dashed border-border p-6 text-center text-[11px] font-medium text-text-muted">
                      Drop cards here
                    </p>
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
        <div className="hidden gap-6 overflow-x-auto pb-4 md:flex">
          {BOARD_COLUMNS.map((status) => {
            const items = applications.filter((a) => a.status === status);
            return (
              <div key={status} className="flex min-w-[300px] max-w-[350px] flex-1 flex-col">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-transparent z-10">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${DOT_COLORS[status]}`} />
                    <span className="font-display text-sm font-bold text-text">{STATUS_LABELS[status]}</span>
                  </div>
                  <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-bold text-text-muted">
                    {items.length}
                  </span>
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
                    <p className="rounded-xl border-2 border-dashed border-border p-8 text-center text-[11px] font-medium text-text-muted">
                      Drag applications here
                    </p>
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
