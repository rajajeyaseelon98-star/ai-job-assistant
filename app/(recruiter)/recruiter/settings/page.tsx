"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeftRight } from "lucide-react";

export default function RecruiterSettingsPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.name) setName(data.name);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setSuccess("Settings saved!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function switchToJobSeeker() {
    await fetch("/api/user/role", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "job_seeker" }),
    });
    router.push("/dashboard");
    router.refresh();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-8">Settings</h1>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[32px] p-8 sm:p-10 mb-8">
        <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-6 block">Profile</span>
        <div>
          <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Display Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-sm text-slate-900" />
        </div>
        {success && <p className="text-sm text-emerald-600 mt-4">{success}</p>}
        <button type="submit" disabled={saving}
          className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-8 py-3 font-bold transition-all flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </form>

      <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-8 sm:p-10">
        <h2 className="font-display text-lg font-bold text-slate-900 mb-2">Switch Role</h2>
        <p className="text-slate-500 text-sm mb-6">Move between recruiter and job seeker workspace without leaving your account.</p>
        <button onClick={switchToJobSeeker}
          className="bg-white border border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600 shadow-sm rounded-xl px-6 py-3 font-bold transition-all flex items-center gap-2 w-fit">
          <ArrowLeftRight className="h-4 w-4" /> Switch to Job Seeker
        </button>
      </div>

      <p className="mt-12 text-center text-xs text-slate-400">Managed account security powered by AI Job Assistant.</p>
    </div>
  );
}
