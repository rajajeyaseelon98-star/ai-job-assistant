"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Application, ApplicationStatus } from "@/types/application";
import { STATUS_LABELS } from "@/types/application";

interface ApplicationFormProps {
  initial?: Partial<Application>;
  onSave: (app: Application) => void;
  onCancel: () => void;
}

export function ApplicationForm({ initial, onSave, onCancel }: ApplicationFormProps) {
  const [company, setCompany] = useState(initial?.company || "");
  const [role, setRole] = useState(initial?.role || "");
  const [status, setStatus] = useState<ApplicationStatus>(initial?.status || "saved");
  const [appliedDate, setAppliedDate] = useState(initial?.applied_date || "");
  const [url, setUrl] = useState(initial?.url || "");
  const [salary, setSalary] = useState(initial?.salary || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!initial?.id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError("Company and role are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = isEdit ? `/api/applications/${initial!.id}` : "/api/applications";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          status,
          applied_date: appliedDate || null,
          url: url.trim() || null,
          salary: salary.trim() || null,
          location: location.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }

      const data = await res.json();
      onSave(data);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-card sm:p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-semibold text-foreground">
          {isEdit ? "Edit Application" : "Add Application"}
        </h3>
        <button type="button" onClick={onCancel} className="text-text-muted hover:text-text active:text-text/70 min-h-[44px] min-w-[44px] flex items-center justify-center">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label-field text-xs">Company *</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Google, Amazon..."
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field text-xs">Role *</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Senior Frontend Developer"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="label-field text-xs">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="input-field"
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field text-xs">Applied Date</label>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field text-xs">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Remote, NYC..."
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label-field text-xs">Job URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field text-xs">Salary</label>
            <input
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="$120k - $150k"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="label-field text-xs">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Recruiter name, interview feedback, next steps..."
            className="input-field min-h-[100px] resize-y py-2.5 sm:min-h-[88px]"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isEdit ? "Update" : "Add Application"}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
