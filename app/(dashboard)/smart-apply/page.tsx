"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Zap, Loader2, Clock, TrendingUp, Settings2 } from "lucide-react";
import { useSmartApplyRules, useResumes, useUsage, useSaveSmartApplyRule, useToggleSmartApplyRule } from "@/hooks/queries/use-smart-apply";
import type { SmartApplyRule } from "@/types/autoApply";
import { humanizeSmartApplyError, humanizeNetworkError } from "@/lib/friendlyApiError";
import { toAiUiError } from "@/lib/client-ai-error";
import { AICreditExhaustedAlert } from "@/components/ui/AICreditExhaustedAlert";
import { SmartApplyRunHealthCard } from "@/components/smart-apply/SmartApplyRunHealthCard";
import { ActionStatusBanner } from "@/components/ui/ActionStatusBanner";

export default function SmartApplyPage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isCreditError, setIsCreditError] = useState(false);
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

  const { data: rulesData = [], isLoading: rulesLoading } = useSmartApplyRules();
  const { data: resumesData = [] } = useResumes();
  const { data: usageData } = useUsage();
  const saveMutation = useSaveSmartApplyRule();
  const toggleMutation = useToggleSmartApplyRule();

  const rules = rulesData;
  const resumes = resumesData;
  const loading = rulesLoading;
  const usage = usageData ?? null;

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || rules.length === 0) return;
    initialized.current = true;
    const r = rules[0];
    setResumeId(r.resume_id);
    setMinMatchScore(r.rules.min_match_score || 75);
    setMinSalary(r.rules.min_salary?.toString() || "");
    setMaxSalary(r.rules.max_salary?.toString() || "");
    setRoles(r.rules.preferred_roles?.join(", ") || "");
    setLocations(r.rules.preferred_locations?.join(", ") || "");
    setIncludeRemote(r.rules.include_remote !== false);
    setMaxPerDay(r.rules.max_applications_per_day || 5);
    setMaxPerWeek(r.rules.max_applications_per_week || 20);
  }, [rules]);

  useEffect(() => {
    if (resumes.length > 0 && !resumeId) setResumeId(resumes[0].id);
  }, [resumes]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setIsCreditError(false);
    setSuccess("");
    try {
      await saveMutation.mutateAsync({
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
      });
      setSuccess("Smart Auto-Apply rules saved and activated!");
    } catch (err) {
      if (err instanceof Error) {
        const ui = toAiUiError(err);
        setError(humanizeSmartApplyError(ui.message));
        setIsCreditError(ui.isCreditsExhausted);
      } else {
        setError(humanizeNetworkError());
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(ruleId: string, enabled: boolean) {
    try {
      await toggleMutation.mutateAsync({ id: ruleId, enabled });
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
    <div className="mx-auto w-full max-w-3xl py-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="mb-2 flex items-center gap-3 font-display text-3xl font-bold text-slate-900 tracking-tight">
          <Zap className="h-6 w-6 text-amber-500" /> Smart Auto-Apply
        </h1>
        <p className="text-slate-500 text-base mb-6 leading-relaxed">
          <strong className="font-medium text-slate-700">Set once</strong> → we apply daily for you. Our AI finds matching jobs and applies on your schedule. <strong className="font-medium text-slate-700">Pro feature</strong> — you&apos;ll get notified for each run.
        </p>

        {usage && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800 leading-relaxed mb-6 shadow-sm">
            {usage.smart_apply.limit === 0 ? (
              <>
                <strong>Plan limits:</strong> Smart Auto-Apply is included on <strong>Pro</strong> and{" "}
                <strong>Premium</strong>. Free plans can use{" "}
                <Link href="/auto-apply" className="font-medium underline">
                  AI Auto-Apply
                </Link>{" "}
                with monthly caps shown on your dashboard.
              </>
            ) : (
              <>
                <strong>How limits work:</strong> Rules run on a <strong>~24h cadence</strong>. Each run applies
                only up to your <strong>max/day</strong> and <strong>max/week</strong> below (and your match
                threshold). Pro: unlimited scheduled runs within those caps. This month&apos;s Smart Auto-Apply
                events logged: <strong>{usage.smart_apply.used}</strong>
                {usage.smart_apply.limit === -1 ? " (unlimited)" : ` / ${usage.smart_apply.limit}`}.
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        isCreditError ? (
          <AICreditExhaustedAlert message={error} pricingHref="/pricing" />
        ) : (
          <ActionStatusBanner kind="error" message={error} />
        )
      )}
      {success && (
        <ActionStatusBanner kind="success" message={success} />
      )}

      {/* Active Rules Status */}
      {rules.length > 0 && (
        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg font-semibold text-text flex items-center gap-2">
            <Settings2 className="h-4 w-4 sm:h-5 sm:w-5" /> Active Rules
          </h2>
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-5"
            >
              <div className="flex w-full items-start justify-between gap-4 sm:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    {rule.enabled ? (
                      <span
                        className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={`text-sm font-bold ${
                        rule.enabled ? "text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {rule.enabled ? "Active" : "Paused"}
                    </span>
                    <span className="text-xs text-slate-500">
                      &middot; Min score: {rule.rules.min_match_score}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {rule.total_applied} applied total
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {rule.total_runs} runs
                    </span>
                    {rule.last_run_at && (
                      <span className="text-sm">Last: {new Date(rule.last_run_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  {rule.total_runs > 0 && rule.total_applied === 0 ? (
                    <p className="mt-2 text-xs text-amber-700">
                      0 jobs applied so far. Check minimum match score, role/location filters, and salary constraints.
                    </p>
                  ) : null}
                </div>
                <button
                  onClick={() => handleToggle(rule.id, !rule.enabled)}
                  className={`rounded-xl px-5 py-2 text-sm font-medium transition-all shadow-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 ${
                    rule.enabled ? "hover:border-rose-200 hover:text-rose-600" : ""
                  }`}
                >
                  {rule.enabled ? "Pause" : "Enable"}
                </button>
              </div>
              <div className="w-full sm:w-auto">
                <SmartApplyRunHealthCard
                  lastRunAt={rule.last_execution_meta?.lastRunAt ?? rule.last_run_at}
                  nextRunAt={rule.last_execution_meta?.nextRunAt ?? rule.next_run_at}
                  reasonCode={rule.last_execution_meta?.reasonCode ?? rule.last_outcome_reason}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Form */}
      <form
        onSubmit={handleSave}
        className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-6 sm:p-8"
      >
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
          {rules.length > 0 ? "Update Rules" : "Set Up Smart Auto-Apply"}
        </h2>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Resume *</label>
          {resumes.length === 0 ? (
            <p className="text-sm text-red-600">No resumes found. Upload one first.</p>
          ) : (
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Minimum Match Score: {minMatchScore}%
          </label>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(Number(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <div className="mt-2 flex justify-between text-xs font-medium text-slate-400">
            <span>More jobs (50%)</span>
            <span>Better fit (95%)</span>
          </div>
        </div>

        {/* Salary Range */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Min Salary (annual)</label>
            <input
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="e.g., 50000"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Max Salary (annual)</label>
            <input
              type="number"
              value={maxSalary}
              onChange={(e) => setMaxSalary(e.target.value)}
              placeholder="e.g., 150000"
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Roles */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Preferred Roles (comma-separated)</label>
          <input
            type="text"
            value={roles}
            onChange={(e) => setRoles(e.target.value)}
            placeholder="e.g., Software Engineer, Full Stack Developer"
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Locations */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Preferred Locations (comma-separated)</label>
          <input
            type="text"
            value={locations}
            onChange={(e) => setLocations(e.target.value)}
            placeholder="e.g., Chennai, Bangalore, New York"
            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeRemote}
            onChange={(e) => setIncludeRemote(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition-all cursor-pointer"
          />
          <span className="text-sm text-slate-600">Include remote jobs</span>
        </label>

        {/* Application Limits */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Max applications / day</label>
            <select
              value={maxPerDay}
              onChange={(e) => setMaxPerDay(Number(e.target.value))}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {[1, 2, 3, 5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Max applications / week</label>
            <select
              value={maxPerWeek}
              onChange={(e) => setMaxPerWeek(Number(e.target.value))}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
          className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {saving ? "Saving..." : rules.length > 0 ? "Update & Activate" : "Activate Smart Auto-Apply"}
        </button>
        <Link
          href="/auto-apply"
          className="ml-0 mt-2 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:ml-2 sm:mt-0 sm:w-auto"
        >
          Run now with AI Auto-Apply
        </Link>
      </form>

      {/* How it works */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 text-sm text-slate-600 leading-relaxed">
        <h3 className="font-display mb-3 text-sm font-semibold text-slate-900">How Smart Auto-Apply works</h3>
        <ol className="list-decimal list-inside space-y-3">
          <li>You set your match criteria (score, salary, roles, locations)</li>
          <li>Our system scans for new jobs every 24 hours</li>
          <li>Jobs matching your rules are automatically applied to</li>
          <li>You get notified for every application via the bell icon</li>
          <li>All applications are tracked in your Applications page</li>
        </ol>
        <p className="font-medium text-slate-900 mt-4 block">
          You stay in control — pause or adjust rules anytime.
        </p>
      </div>
    </div>
  );
}
