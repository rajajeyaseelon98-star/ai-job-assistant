"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Bell } from "lucide-react";

interface SavedAlert {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
}

export default function RecruiterAlertsPage() {
  const [alerts, setAlerts] = useState<SavedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetch("/api/recruiter/alerts")
      .then((r) => (r.ok ? r.json() : []))
      .then(setAlerts)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/recruiter/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          filters: {
            skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
            experience: experience || undefined,
            location: location || undefined,
          },
        }),
      });
      if (res.ok) {
        const alert = await res.json();
        setAlerts((prev) => [alert, ...prev]);
        setName("");
        setSkills("");
        setExperience("");
        setLocation("");
        setShowForm(false);
      }
    } catch { /* ignore */ }
    finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/recruiter/alerts/${id}`, { method: "DELETE" });
    if (res.ok) setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">Saved Alerts</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 min-h-[44px] w-full sm:w-auto">
          <Plus className="h-4 w-4" /> New Alert
        </button>
      </div>

      <p className="text-sm text-text-muted">
        Save candidate search criteria to get notified when matching candidates appear.
      </p>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Alert Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Senior React Devs in Chennai"
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Skills (comma-separated)</label>
            <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js..."
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Experience Level</label>
              <select value={experience} onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]">
                <option value="">Any</option>
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Chennai"
                className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none min-h-[44px]" />
            </div>
          </div>
          <button type="submit" disabled={creating}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 min-h-[44px] w-full sm:w-auto">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Alert
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
          <Bell className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-text-muted">No saved alerts yet. Create one to track candidates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const filters = alert.filters as Record<string, unknown>;
            return (
              <div key={alert.id} className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-card p-3 sm:p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{alert.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {Array.isArray(filters.skills) && (filters.skills as string[]).map((s) => (
                      <span key={s} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{s}</span>
                    ))}
                    {filters.experience ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">{String(filters.experience)}</span>
                    ) : null}
                    {filters.location ? (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">{String(filters.location)}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-text-muted">Created {new Date(alert.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDelete(alert.id)} className="shrink-0 rounded-lg p-2 text-text-muted hover:bg-red-50 hover:text-red-600 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
