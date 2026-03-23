"use client";

import { useState, useEffect } from "react";
import { Loader2, Rocket } from "lucide-react";

interface Resume {
  id: string;
  file_name: string;
  created_at: string;
}

interface AutoApplyFormProps {
  onStart: (config: {
    resume_id: string;
    location?: string;
    preferred_roles?: string[];
    min_salary?: number;
    max_results?: number;
  }) => void;
  loading: boolean;
}

export function AutoApplyForm({ onStart, loading }: AutoApplyFormProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeId, setResumeId] = useState("");
  const [location, setLocation] = useState("");
  const [roles, setRoles] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [maxResults, setMaxResults] = useState("10");
  const [loadingResumes, setLoadingResumes] = useState(true);

  useEffect(() => {
    fetch("/api/upload-resume")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Resume[]) => {
        setResumes(data);
        if (data.length > 0) setResumeId(data[0].id);
      })
      .finally(() => setLoadingResumes(false));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeId) return;
    onStart({
      resume_id: resumeId,
      location: location.trim() || undefined,
      preferred_roles: roles.trim()
        ? roles.split(",").map((r) => r.trim()).filter(Boolean)
        : undefined,
      min_salary: minSalary ? Number(minSalary) : undefined,
      max_results: Number(maxResults) || 10,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="font-display text-xl font-semibold text-slate-900">Configure Auto-Apply</h2>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Resume *</label>
        {loadingResumes ? (
          <p className="text-sm text-slate-500">Loading resumes...</p>
        ) : resumes.length === 0 ? (
          <p className="text-sm text-red-600">No resumes found. Upload one first.</p>
        ) : (
          <select
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.file_name} ({new Date(r.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Preferred Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Remote, Chennai, New York"
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Min. Salary (annual)</label>
          <input
            type="number"
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
            placeholder="e.g., 50000"
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Preferred Roles (comma-separated)</label>
        <input
          type="text"
          value={roles}
          onChange={(e) => setRoles(e.target.value)}
          placeholder="e.g., Software Engineer, Full Stack Developer"
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
        />
        <p className="mt-2 text-xs text-slate-500">Leave blank to auto-detect from resume</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Max Jobs to Match</label>
        <select
          value={maxResults}
          onChange={(e) => setMaxResults(e.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="5">5 jobs</option>
          <option value="10">10 jobs</option>
          <option value="15">15 jobs</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !resumeId}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 font-medium text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
        {loading ? "Starting..." : "Start Auto-Apply"}
      </button>
    </form>
  );
}
