"use client";

import { useState, useEffect } from "react";
import { Zap, Loader2, Power, PowerOff, Clock, TrendingUp, Settings2 } from "lucide-react";
import type { SmartApplyRule } from "@/types/autoApply";

interface Resume {
  id: string;
  file_name: string;
  created_at: string;
}

export default function SmartApplyPage() {
  const [rules, setRules] = useState<SmartApplyRule[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [resumeId, setResumeId] = useState("");
  const [minMatchScore, setMinMatchScore] = useState(75);
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [roles, setRoles] = useState("");
  const [locations, setLocations] = useState("");
  const [includeRemote, setIncludeRemote] = useState(true);
  const [maxPerDay, setMaxPerDay] = useState(5);
  const [maxPerWeek, setMaxPerWeek] = useState(20);

  useEffect(() => {
    Promise.all([
      fetch("/api/smart-apply").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/upload-resume").then((r) => (r.ok ? r.json() : [])),
    ]).then(([rulesData, resumesData]) => {
      setRules(rulesData);
      setResumes(resumesData);
      if (resumesData.length > 0) setResumeId(resumesData[0].id);

      // Pre-fill form from existing rule
      if (rulesData.length > 0) {
        const r = rulesData[0];
        setResumeId(r.resume_id);
        setMinMatchScore(r.rules.min_match_score || 75);
        setMinSalary(r.rules.min_salary?.toString() || "");
        setMaxSalary(r.rules.max_salary?.toString() || "");
        setRoles(r.rules.preferred_roles?.join(", ") || "");
        setLocations(r.rules.preferred_locations?.join(", ") || "");
        setIncludeRemote(r.rules.include_remote !== false);
        setMaxPerDay(r.rules.max_applications_per_day || 5);
        setMaxPerWeek(r.rules.max_applications_per_week || 20);
      }
    }).finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/smart-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: resumeId,
          enabled: true,
          min_match_score: minMatchScore,
          min_salary: minSalary ? Number(minSalary) : undefined,
          max_salary: maxSalary ? Number(maxSalary) : undefined,
          preferred_roles: roles.split(",").map((r) => r.trim()).filter(Boolean),
          preferred_locations: locations.split(",").map((l) => l.trim()).filter(Boolean),
          include_remote: includeRemote,
          max_applications_per_day: maxPerDay,
          max_applications_per_week: maxPerWeek,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRules((prev) => {
          const idx = prev.findIndex((r) => r.resume_id === resumeId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = data;
            return updated;
          }
          return [data, ...prev];
        });
        setSuccess("Smart Auto-Apply rules saved and activated!");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save rules");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(ruleId: string, enabled: boolean) {
    try {
      const res = await fetch("/api/smart-apply", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ruleId, enabled }),
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r))
        );
      }
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl font-bold text-text">
          <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" /> Smart Auto-Apply
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-text-muted">
          Set your rules once. Our AI finds and applies to matching jobs automatically every day.
          You&apos;ll get notified for every application.
        </p>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">{success}</div>}

      {/* Active Rules Status */}
      {rules.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-semibold text-text flex items-center gap-2">
            <Settings2 className="h-4 w-4 sm:h-5 sm:w-5" /> Active Rules
          </h2>
          {rules.map((rule) => (
            <div key={rule.id} className={`rounded-xl border p-3 sm:p-4 ${
              rule.enabled ? "border-green-200 bg-green-50" : "border-gray-200 bg-card"
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    {rule.enabled ? (
                      <Power className="h-4 w-4 text-green-600" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm font-semibold text-text">
                      {rule.enabled ? "Active" : "Paused"}
                    </span>
                    <span className="text-xs text-text-muted">
                      &middot; Min score: {rule.rules.min_match_score}%
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {rule.total_applied} applied total
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {rule.total_runs} runs
                    </span>
                    {rule.last_run_at && (
                      <span>Last: {new Date(rule.last_run_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(rule.id, !rule.enabled)}
                  className={`min-h-[44px] sm:min-h-0 rounded-lg px-3 py-1.5 text-xs font-medium active:scale-[0.98] ${
                    rule.enabled
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {rule.enabled ? "Pause" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-text">
          {rules.length > 0 ? "Update Rules" : "Set Up Smart Auto-Apply"}
        </h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Resume *</label>
          {resumes.length === 0 ? (
            <p className="text-sm text-red-600">No resumes found. Upload one first.</p>
          ) : (
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none"
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.file_name} ({new Date(r.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Match Score Threshold */}
        <div>
          <label className="mb-1 block text-sm font-medium text-text">
            Minimum Match Score: {minMatchScore}%
          </label>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>More jobs (50%)</span>
            <span>Better fit (95%)</span>
          </div>
        </div>

        {/* Salary Range */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Min Salary (annual)</label>
            <input
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="e.g., 50000"
              className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Max Salary (annual)</label>
            <input
              type="number"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
              placeholder="e.g., 150000"
              className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Roles */}
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Preferred Roles (comma-separated)</label>
          <input
            type="text"
            value={roles}
            onChange={(e) => setRoles(e.target.value)}
            placeholder="e.g., Software Engineer, Full Stack Developer"
            className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none"
          />
        </div>

        {/* Locations */}
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Preferred Locations (comma-separated)</label>
          <input
            type="text"
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            placeholder="e.g., Chennai, Bangalore, New York"
            className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeRemote}
            onChange={(e) => setIncludeRemote(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-text">Include remote jobs</span>
        </label>

        {/* Application Limits */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Max applications / day</label>
            <select
              value={maxPerDay}
              onChange={(e) => setMaxPerDay(Number(e.target.value))}
              className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none"
            >
              {[1, 2, 3, 5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Max applications / week</label>
            <select
              value={maxPerWeek}
              onChange={(e) => setMaxPerWeek(Number(e.target.value))}
              className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none"
            >
              {[5, 10, 20, 30, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !resumeId}
          className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {saving ? "Saving..." : rules.length > 0 ? "Update & Activate" : "Activate Smart Auto-Apply"}
        </button>
      </form>

      {/* How it works */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 sm:p-4 space-y-2">
        <h3 className="text-sm font-semibold text-blue-900">How Smart Auto-Apply works</h3>
        <ol className="list-decimal list-inside space-y-1 text-xs text-blue-800">
          <li>You set your match criteria (score, salary, roles, locations)</li>
          <li>Our system scans for new jobs every 24 hours</li>
          <li>Jobs matching your rules are automatically applied to</li>
          <li>You get notified for every application via the bell icon</li>
          <li>All applications are tracked in your Applications page</li>
        </ol>
        <p className="text-xs text-blue-700 font-medium mt-2">
          You stay in control — pause or adjust rules anytime.
        </p>
      </div>
    </div>
  );
}
