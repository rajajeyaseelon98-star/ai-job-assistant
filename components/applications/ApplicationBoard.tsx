"use client";

import { useState } from "react";
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
import { STATUS_LABELS, STATUS_COLORS } from "@/types/application";

interface ApplicationBoardProps {
  applications: Application[];
  view: "board" | "list";
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}

const BOARD_COLUMNS: ApplicationStatus[] = ["saved", "applied", "interviewing", "offer", "rejected"];

function ApplicationCard({
  app,
  onEdit,
  onDelete,
  onStatusChange,
  showStatus,
}: {
  app: Application;
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  showStatus?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-text truncate">{app.role}</h4>
          <p className="text-xs text-text-muted truncate">{app.company}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => onEdit(app)} className="text-text-muted hover:text-primary p-0.5">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(app.id)} className="text-text-muted hover:text-red-500 p-0.5">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
        {showStatus && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[app.status]}`}>
            {STATUS_LABELS[app.status]}
          </span>
        )}
        {app.location && (
          <span className="flex items-center gap-0.5">
            <MapPin className="h-3 w-3" /> {app.location}
          </span>
        )}
        {app.salary && (
          <span className="flex items-center gap-0.5">
            <DollarSign className="h-3 w-3" /> {app.salary}
          </span>
        )}
        {app.applied_date && (
          <span className="flex items-center gap-0.5">
            <Calendar className="h-3 w-3" /> {new Date(app.applied_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {(app.notes || app.url) && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Less" : "More"}
        </button>
      )}

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {app.notes && <p className="text-xs text-text-muted">{app.notes}</p>}
          {app.url && (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> View listing
            </a>
          )}
          <select
            value={app.status}
            onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
            className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-text"
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
      <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
        <p className="text-sm text-text-muted">No applications yet. Add your first one above.</p>
      </div>
    );
  }

  if (view === "board") {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {BOARD_COLUMNS.map((status) => {
          const items = applications.filter((a) => a.status === status);
          return (
            <div key={status} className="min-w-[220px] flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-xs text-text-muted">{items.length}</span>
              </div>
              <div className="space-y-2 rounded-lg bg-gray-50 p-2 min-h-[100px]">
                {items.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            </div>
          );
        })}
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
