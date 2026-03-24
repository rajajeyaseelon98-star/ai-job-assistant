"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Bell } from "lucide-react";
import { useRecruiterAlerts, useCreateAlert, useDeleteAlert } from "@/hooks/queries/use-recruiter";

interface SavedAlert {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  created_at: string;
}

export default function RecruiterAlertsPage() {
  const { data: alertsRaw, isLoading: loading } = useRecruiterAlerts();
  const alerts = (alertsRaw ?? []) as SavedAlert[];
  const createMutation = useCreateAlert();
  const deleteMutation = useDeleteAlert();
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        filters: {
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          experience: experience || undefined,
          location: location || undefined,
        },
      });
      setName(""); setSkills(""); setExperience(""); setLocation(""); setShowForm(false);
    } catch { /* ignore */ }
    finally { setCreating(false); }
  }

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id);
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-12 px-6 space-y-8">
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Saved Alerts</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 rounded-xl px-6 py-3 font-bold transition-all flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Alert
        </button>
      </div>

      <p className="text-sm text-slate-500">
        Save candidate search criteria to get notified when matching candidates appear.
      </p>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[32px] p-8 sm:p-10 mb-12 relative space-y-6">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-6 block">Create Alert</span>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Alert Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Senior React Devs in Chennai"
              className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Skills (comma-separated)</label>
              <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm w-full" />
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Experience Level</label>
              <select value={experience} onChange={(e) => setExperience(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm w-full">
                <option value="">Any</option>
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Chennai"
                className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm w-full" />
            </div>
          </div>
          <div className="flex justify-end mt-8 pt-6 border-t border-slate-50">
            <button type="submit" disabled={creating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-10 py-3.5 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Alert
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : alerts.length === 0 ? (
        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px] py-24 text-center">
          <div className="w-16 h-16 bg-white text-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Bell className="h-8 w-8" />
          </div>
          <p className="font-display text-xl font-bold text-slate-900 mb-2">No Active Monitors</p>
          <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">Create your first talent radar alert to track candidate pools by skills, experience, and location.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const filters = alert.filters as Record<string, unknown>;
            return (
              <div key={alert.id} className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 flex items-center justify-between hover:border-indigo-300 transition-all group">
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-slate-900 text-base">{alert.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {Array.isArray(filters.skills) && (filters.skills as string[]).map((s) => (
                      <span key={s} className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700">{s}</span>
                    ))}
                    {filters.experience ? (
                      <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700">{String(filters.experience)}</span>
                    ) : null}
                    {filters.location ? (
                      <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700">{String(filters.location)}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Created {new Date(alert.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDelete(alert.id)} className="shrink-0 rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
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
