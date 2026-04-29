"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUpdateUser } from "@/hooks/queries/use-recruiter";
import { useDeleteAccount, useRemoveAvatar, useUploadAvatar } from "@/hooks/queries/use-user";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { DevPlanSwitcher } from "./DevPlanSwitcher";

interface SettingsFormProps {
  name: string;
  email: string;
  planType: string;
  avatarUrl: string | null;
  profileStrength: number | null;
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
  avatarUrl: initialAvatarUrl,
  profileStrength,
  experienceLevel: initialExp,
  preferredRole: initialRole,
  preferredLocation: initialLoc,
  salaryExpectation: initialSalary,
}: SettingsFormProps) {
  const router = useRouter();
  const updateUserMut = useUpdateUser();
  const uploadAvatarMut = useUploadAvatar();
  const removeAvatarMut = useRemoveAvatar();
  const deleteAccountMut = useDeleteAccount();
  const [name, setName] = useState(initialName);
  const [experienceLevel, setExperienceLevel] = useState(initialExp);
  const [preferredRole, setPreferredRole] = useState(initialRole);
  const [preferredLocation, setPreferredLocation] = useState(initialLoc);
  const [salaryExpectation, setSalaryExpectation] = useState(initialSalary);
  const saving = updateUserMut.isPending;
  const deleting = deleteAccountMut.isPending;
  const avatarBusy = uploadAvatarMut.isPending || removeAvatarMut.isPending;

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await uploadAvatarMut.mutateAsync(file);
      router.refresh();
    } catch {
      /* ignore */
    }
  }

  async function onRemoveAvatar() {
    if (!confirm("Remove your profile photo?")) return;
    try {
      await removeAvatarMut.mutateAsync();
      router.refresh();
    } catch {
      /* ignore */
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateUserMut.mutateAsync({
        name: name.trim() || null,
        experience_level: experienceLevel || null,
        preferred_role: preferredRole.trim() || null,
        preferred_location: preferredLocation.trim() || null,
        salary_expectation: salaryExpectation.trim() || null,
      });
      router.refresh();
    } catch {
      /* no toast in original */
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Delete your account and all data? This cannot be undone.")) return;
    try {
      await deleteAccountMut.mutateAsync();
      window.location.href = "/";
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 mb-8">
        <h2 className="font-display text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-50">Profile</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 pb-8 border-b border-slate-50">
          <UserAvatar name={name} avatarUrl={initialAvatarUrl} userId={undefined} size={96} />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Profile photo</p>
            <p className="text-xs text-slate-500 max-w-md">
              JPEG, PNG, or WebP — max 2MB. Shown on your public profile and in messages.
              {profileStrength != null ? (
                <span className="block mt-1 text-slate-600">
                  Profile strength: <strong>{profileStrength}%</strong>
                </span>
              ) : null}
            </p>
            <details className="mt-3 max-w-lg rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-semibold text-indigo-700 outline-none hover:text-indigo-800">
                What counts toward profile strength?
              </summary>
              <p className="mt-2 leading-relaxed">
                The percentage reflects your <strong>public profile</strong> and resume signals — not the career
                preference fields on this page (those help job matching).
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Display name</li>
                <li>Headline and bio (edit via your public profile when enabled)</li>
                <li>Profile photo</li>
                <li>Skills (from your resume / skill badges)</li>
                <li>At least one uploaded resume</li>
                <li>ATS score from resume analysis</li>
              </ul>
            </details>
            <div className="flex flex-wrap gap-2 pt-1">
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={avatarBusy}
                  onChange={onPickAvatar}
                />
                <span className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {avatarBusy ? "Working…" : "Upload photo"}
                </span>
              </label>
              {initialAvatarUrl ? (
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={() => void onRemoveAvatar()}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Name</label>
              <input
                type="text"
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Email</label>
              <div className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full">
                {email}
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Experience level</label>
            <select
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full md:max-w-sm transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-6 py-2.5 font-medium transition-all mt-6 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 mb-8">
        <h2 className="font-display text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-50">Career preferences</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Preferred role</label>
              <input
                type="text"
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
                placeholder="e.g. Frontend Developer"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Preferred location</label>
              <input
                type="text"
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                placeholder="e.g. Remote, Bangalore"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Salary expectation</label>
            <input
              type="text"
              className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full md:max-w-sm transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
              value={salaryExpectation}
              onChange={(e) => setSalaryExpectation(e.target.value)}
              placeholder="e.g. 8-12 LPA"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-6 py-2.5 font-medium transition-all mt-6 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </form>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 mb-8">
        <h2 className="font-display text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-50">Advanced</h2>
        <p className="text-sm text-slate-500">
          Optional tools — not required for the main flow (upload resume → score → apply).
        </p>
        <ul className="mt-4 space-y-3 text-sm">
          <li>
            <Link href="/import-linkedin" className="text-indigo-600 font-medium hover:underline underline-offset-4 flex items-center gap-2">
              LinkedIn import
            </Link>
            <span className="text-slate-500"> — generate a draft from profile text or PDF</span>
          </li>
          <li>
            <Link href="/resume-builder" className="text-indigo-600 font-medium hover:underline underline-offset-4 flex items-center gap-2">
              Quick Resume Builder
            </Link>
            <span className="text-slate-500"> — guided draft, then open in Resume Analyzer</span>
          </li>
        </ul>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 mb-8">
        <h2 className="font-display text-xl font-bold text-slate-900 mb-6 pb-4 border-b border-slate-50">Subscription</h2>
        <p className="mt-2 text-sm text-slate-500">
          Current plan:{" "}
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            {planType}
          </span>
        </p>
        <Link
          href="/pricing"
          className="text-indigo-600 font-semibold hover:text-indigo-700 text-sm mt-4 block"
        >
          Upgrade or change plan →
        </Link>
      </section>

      <DevPlanSwitcher currentPlan={planType as "free" | "pro" | "premium"} />

      <section className="bg-rose-50 border border-rose-100 rounded-2xl p-6">
        <h2 className="text-rose-800 font-bold text-sm mb-1">Danger zone</h2>
        <p className="text-rose-600 text-xs mb-4">
          Delete your account and all your data. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl px-6 py-2.5 font-medium transition-all disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete account"}
        </button>
      </section>
    </>
  );
}
