"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Application, ApplicationStatus } from "@/types/application";
import { STATUS_LABELS } from "@/types/application";
import { useSaveApplication } from "@/hooks/queries/use-applications";
import { formatApiFetchThrownError } from "@/lib/api-error";

interface ApplicationFormProps {
  initial?: Partial<Application>;
  onSave: (app: Application) => void;
  onCancel: () => void;
}

export function ApplicationForm({ initial, onSave, onCancel }: ApplicationFormProps) {
  const saveMut = useSaveApplication();
  const [company, setCompany] = useState(initial?.company || "");
  const [role, setRole] = useState(initial?.role || "");
  const [status, setStatus] = useState<ApplicationStatus>(initial?.status || "saved");
  const [appliedDate, setAppliedDate] = useState(initial?.applied_date || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [salary, setSalary] = useState(initial?.salary || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState("");
  const loading = saveMut.isPending;

  const isEdit = !!initial?.id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError("Company and role are required");
      return;
    }

    setError("");

    try {
      const body = {
        company: company.trim(),
        role: role.trim(),
        status,
        applied_date: appliedDate || null,
        url: url.trim() || null,
        salary: salary.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
      };
      const data = await saveMut.mutateAsync({
        id: isEdit ? initial!.id : undefined,
        body,
      });
      onSave(data);
    } catch (e) {
      setError(formatApiFetchThrownError(e) || "Something went wrong");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 sm:px-8">
          <h3 className="font-display text-lg font-bold text-slate-900">
            {isEdit ? "Edit Application" : "Add Application"}
          </h3>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6 sm:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Company *</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Google, Amazon..."
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Role *</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Senior Frontend Developer"
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Applied Date</label>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote, NYC..."
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Job URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Salary</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="$120k - $150k"
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Recruiter name, interview feedback, next steps..."
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full min-h-[100px] resize-y transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-6 py-2.5 font-medium transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isEdit ? "Update" : "Add Application"}
            </button>
            <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
