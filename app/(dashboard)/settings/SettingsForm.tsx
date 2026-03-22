"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DevPlanSwitcher } from "./DevPlanSwitcher";

interface SettingsFormProps {
  name: string;
  email: string;
  planType: string;
  experienceLevel: string;
  preferredRole: string;
  preferredLocation: string;
  salaryExpectation: string;
}

const EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior"];

export function SettingsForm({
  name: initialName,
  email,
  planType,
  experienceLevel: initialExp,
  preferredRole: initialRole,
  preferredLocation: initialLoc,
  salaryExpectation: initialSalary,
}: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [experienceLevel, setExperienceLevel] = useState(initialExp);
  const [preferredRole, setPreferredRole] = useState(initialRole);
  const [preferredLocation, setPreferredLocation] = useState(initialLoc);
  const [salaryExpectation, setSalaryExpectation] = useState(initialSalary);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          experience_level: experienceLevel || null,
          preferred_role: preferredRole.trim() || null,
          preferred_location: preferredLocation.trim() || null,
          salary_expectation: salaryExpectation.trim() || null,
        }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Delete your account and all data? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete-account", { method: "POST" });
      if (res.ok) {
        window.location.href = "/";
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="rounded-xl border border-gray-200 bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold text-text">Profile</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted">Name</label>
            <input
              type="text"
              className="mt-1 w-full max-w-md min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm text-text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted">Email</label>
            <p className="mt-1 text-text">{email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted">Experience level</label>
            <select
              className="mt-1 w-full max-w-md min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm text-text"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <option value="">—</option>
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover active:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold text-text">Career preferences</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted">Preferred role</label>
            <input
              type="text"
              className="mt-1 w-full max-w-md min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm text-text"
              value={preferredRole}
              onChange={(e) => setPreferredRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted">Preferred location</label>
            <input
              type="text"
              className="mt-1 w-full max-w-md min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm text-text"
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              placeholder="e.g. Remote, Bangalore"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted">Salary expectation</label>
            <input
              type="text"
              className="mt-1 w-full max-w-md min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm text-text"
              value={salaryExpectation}
              onChange={(e) => setSalaryExpectation(e.target.value)}
              placeholder="e.g. 8-12 LPA"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover active:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold text-text">Advanced</h2>
        <p className="mt-2 text-sm text-text-muted">
          Optional tools — not required for the main flow (upload resume → score → apply).
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/import-linkedin" className="font-medium text-primary hover:underline">
              LinkedIn import
            </Link>
            <span className="text-text-muted"> — generate a draft from profile text or PDF</span>
          </li>
          <li>
            <Link href="/resume-builder" className="font-medium text-primary hover:underline">
              Quick Resume Builder
            </Link>
            <span className="text-text-muted"> — guided draft, then open in Resume Analyzer</span>
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-card p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold text-text">Subscription</h2>
        <p className="mt-2 text-sm text-text-muted">
          Current plan: <span className="capitalize font-medium text-text">{planType}</span>
        </p>
        <Link
          href="/pricing"
          className="mt-4 inline-block min-h-[44px] leading-[44px] text-sm font-medium text-primary hover:underline"
        >
          Upgrade or change plan →
        </Link>
      </section>

      <DevPlanSwitcher currentPlan={planType as "free" | "pro" | "premium"} />

      <section className="rounded-xl border border-red-200 bg-red-50/50 p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold text-red-800">Danger zone</h2>
        <p className="mt-2 text-sm text-red-700">
          Delete your account and all your data. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="mt-4 w-full sm:w-auto min-h-[44px] rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 active:bg-red-100 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete account"}
        </button>
      </section>
    </>
  );
}
