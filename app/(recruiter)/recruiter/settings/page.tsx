"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeftRight } from "lucide-react";
import { useRecruiterUser, useUpdateUser, useSwitchRole } from "@/hooks/queries/use-recruiter";
import { useUploadAvatar, useRemoveAvatar } from "@/hooks/queries/use-user";
import { UserAvatar } from "@/components/ui/UserAvatar";

export default function RecruiterSettingsPage() {
  const router = useRouter();
  const { data: userData, isLoading: loading } = useRecruiterUser();
  const updateMutation = useUpdateUser();
  const switchMutation = useSwitchRole();
  const uploadAvatarMut = useUploadAvatar();
  const removeAvatarMut = useRemoveAvatar();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const u = userData as Record<string, unknown> | undefined;
  const avatarUrl = (u?.avatar_url as string | null | undefined) ?? null;
  const profileStrength = (u?.profile_strength as number | null | undefined) ?? null;
  const userId = u?.id as string | undefined;

  useEffect(() => {
    if (userData && (userData as Record<string, unknown>).name != null) {
      setName(String((userData as Record<string, unknown>).name ?? ""));
    }
  }, [userData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateMutation.mutateAsync({ name });
      setSuccess("Settings saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await uploadAvatarMut.mutateAsync(file);
    } catch {
      /* ignore */
    }
  }

  async function onRemoveAvatar() {
    if (!confirm("Remove your profile photo?")) return;
    try {
      await removeAvatarMut.mutateAsync();
    } catch {
      /* ignore */
    }
  }

  const avatarBusy = uploadAvatarMut.isPending || removeAvatarMut.isPending;

  async function switchToJobSeeker() {
    await switchMutation.mutateAsync("job_seeker");
    router.push("/dashboard");
    router.refresh();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-8">Settings</h1>

      <form
        onSubmit={handleSave}
        className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[32px] p-8 sm:p-10 mb-8"
      >
        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-6 block">Profile</span>

        <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8 pb-8 border-b border-slate-100">
          <UserAvatar name={name} avatarUrl={avatarUrl} userId={userId} size={96} />
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">Profile photo</p>
            <p className="text-xs text-slate-500 max-w-md">
              JPEG, PNG, or WebP — max 2MB. Shown in messages and the top bar.
              {profileStrength != null ? (
                <span className="block mt-1 text-slate-600">
                  Profile strength: <strong>{profileStrength}%</strong>
                </span>
              ) : null}
            </p>
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
              {avatarUrl ? (
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

        <div>
          <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm text-slate-900"
          />
        </div>
        {success && <p className="text-sm text-emerald-600 mt-4">{success}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-8 py-3 font-bold transition-all flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </form>

      <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 sm:p-10">
        <h2 className="font-display text-lg font-bold text-slate-900 mb-2">Switch Role</h2>
        <p className="text-slate-500 text-sm mb-6">
          Move between recruiter and job seeker workspace without leaving your account.
        </p>
        <button
          type="button"
          onClick={() => void switchToJobSeeker()}
          className="bg-white border border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 shadow-sm rounded-xl px-6 py-3 font-bold transition-all flex items-center gap-2 w-fit"
        >
          <ArrowLeftRight className="h-4 w-4" /> Switch to Job Seeker
        </button>
      </div>

      <p className="mt-12 text-center text-xs text-slate-400">Managed account security powered by AI Job Assistant.</p>
    </div>
  );
}
