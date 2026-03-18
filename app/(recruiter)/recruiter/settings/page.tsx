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

  if (loading) return <p className="text-sm text-text-muted">Loading...</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6 sm:space-y-8">
      <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">Settings</h1>

      <form onSubmit={handleSave} className="space-y-3 sm:space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Display Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-base sm:text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
        </div>
        {success && <p className="text-sm text-green-600">{success}</p>}
        <button type="submit" disabled={saving}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 min-h-[44px] w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </form>

      <hr className="border-gray-200" />

      <div>
        <h2 className="mb-2 text-base sm:text-lg font-semibold text-text">Switch Role</h2>
        <button onClick={switchToJobSeeker}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-text hover:bg-gray-50 active:bg-gray-100 min-h-[44px] w-full sm:w-auto">
          <ArrowLeftRight className="h-4 w-4" /> Switch to Job Seeker
        </button>
      </div>
    </div>
  );
}
