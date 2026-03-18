"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, LayoutGrid, List } from "lucide-react";
import { ApplicationForm } from "@/components/applications/ApplicationForm";
import { ApplicationBoard } from "@/components/applications/ApplicationBoard";
import type { Application, ApplicationStatus } from "@/types/application";
import { STATUS_LABELS } from "@/types/application";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [view, setView] = useState<"board" | "list">("board");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleSave(app: Application) {
    if (editing) {
      setApplications((prev) => prev.map((a) => (a.id === app.id ? app : a)));
    } else {
      setApplications((prev) => [app, ...prev]);
    }
    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (res.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
    }
  }

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApplications((prev) => prev.map((a) => (a.id === id ? updated : a)));
    }
  }

  const filtered =
    filterStatus === "all"
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  // Stats
  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === "applied").length,
    interviewing: applications.filter((a) => a.status === "interviewing").length,
    offers: applications.filter((a) => a.status === "offer").length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Application Tracker</h1>
          <p className="mt-1 text-sm sm:text-base text-text-muted">Track your job applications in one place.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-text" },
          { label: "Applied", value: stats.applied, color: "text-blue-600" },
          { label: "Interviewing", value: stats.interviewing, color: "text-yellow-600" },
          { label: "Offers", value: stats.offers, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-card px-4 py-3 sm:px-5 sm:py-4 shadow-sm">
            <p className="text-xs sm:text-sm text-text-muted">{s.label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {(showForm || editing) && (
        <ApplicationForm
          initial={editing || undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="min-h-[44px] sm:min-h-0 rounded-lg border border-gray-300 bg-background px-2 py-1.5 text-base sm:text-sm text-text"
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
          <button
            onClick={() => setView("board")}
            className={`rounded-md p-1.5 ${view === "board" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-md p-1.5 ${view === "list" ? "bg-primary/10 text-primary" : "text-text-muted hover:text-text"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Board/List */}
      {loading ? (
        <p className="text-sm text-text-muted">Loading applications...</p>
      ) : (
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
      )}
    </div>
  );
}
