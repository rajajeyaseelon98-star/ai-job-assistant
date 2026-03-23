"use client";

import { useState, useEffect } from "react";
import { Loader2, Building2, Save } from "lucide-react";

interface CompanyData {
  id?: string;
  name: string;
  description: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  culture: string;
  benefits: string;
}

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<CompanyData>({
    name: "", description: "", website: "", industry: "",
    size: "", location: "", culture: "", benefits: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/recruiter/company")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setCompany({
            id: data.id,
            name: data.name || "",
            description: data.description || "",
            website: data.website || "",
            industry: data.industry || "",
            size: data.size || "",
            location: data.location || "",
            culture: data.culture || "",
            benefits: data.benefits || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company.name.trim()) {
      setError("Company name is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const isUpdate = !!company.id;
      const url = isUpdate ? `/api/recruiter/company/${company.id}` : "/api/recruiter/company";
      const method = isUpdate ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });

      if (res.ok) {
        const data = await res.json();
        setCompany((prev) => ({ ...prev, id: data.id }));
        setSuccess("Company profile saved!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Save failed");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-indigo-600" />
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">Company Profile</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Company Name *</label>
          <input type="text" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
          <textarea value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })}
            rows={4} placeholder="What does your company do?"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Website</label>
            <input type="url" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })}
              placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Industry</label>
            <input type="text" value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })}
              placeholder="Technology, Finance..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Company Size</label>
            <select value={company.size} onChange={(e) => setCompany({ ...company, size: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800">
              <option value="">Select</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="201-500">201-500</option>
              <option value="501-1000">501-1000</option>
              <option value="1000+">1000+</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Location</label>
            <input type="text" value={company.location} onChange={(e) => setCompany({ ...company, location: e.target.value })}
              placeholder="Chennai, India" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Culture</label>
          <textarea value={company.culture} onChange={(e) => setCompany({ ...company, culture: e.target.value })}
            rows={3} placeholder="Describe your company culture..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Benefits</label>
          <textarea value={company.benefits} onChange={(e) => setCompany({ ...company, benefits: e.target.value })}
            rows={3} placeholder="Health insurance, flexible hours, remote work..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400" />
        </div>

        {error && <p className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {success && <p className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">{success}</p>}

        <button type="submit" disabled={saving}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-8 py-3.5 font-medium disabled:opacity-50 w-full md:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Profile
        </button>
      </form>
    </div>
  );
}
