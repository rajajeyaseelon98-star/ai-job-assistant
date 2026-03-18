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
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 space-y-4">
      <h2 className="text-base sm:text-lg font-semibold text-text">Configure Auto-Apply</h2>

      <div>
        <label className="mb-1 block text-sm font-medium text-text">Resume *</label>
        {loadingResumes ? (
          <p className="text-sm text-text-muted">Loading resumes...</p>
        ) : resumes.length === 0 ? (
          <p className="text-sm text-red-600">No resumes found. Upload one first.</p>
        ) : (
          <select
            value={resumeId}
            onChange={(e) => setResumeId(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
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
          <label className="mb-1 block text-sm font-medium text-text">Preferred Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Remote, Chennai, New York"
            className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Min. Salary (annual)</label>
          <input
            type="number"
            value={minSalary}
            onChange={(e) => setMinSalary(e.target.value)}
            placeholder="e.g., 50000"
            className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-text">Preferred Roles (comma-separated)</label>
        <input
          type="text"
          value={roles}
          onChange={(e) => setRoles(e.target.value)}
          placeholder="e.g., Software Engineer, Full Stack Developer"
          className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-xs text-text-muted">Leave blank to auto-detect from resume</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-text">Max Jobs to Match</label>
        <select
          value={maxResults}
          onChange={(e) => setMaxResults(e.target.value)}
          className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
        >
          <option value="5">5 jobs</option>
          <option value="10">10 jobs</option>
          <option value="15">15 jobs</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !resumeId}
        className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 min-h-[44px] text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
        {loading ? "Starting..." : "Start Auto-Apply"}
      </button>
    </form>
  );
}
