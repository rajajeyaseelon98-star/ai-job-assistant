"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Building2, Save } from "lucide-react";
import {
  useRecruiterCompany,
  useSaveCompany,
  useUploadCompanyLogo,
  useRemoveCompanyLogo,
} from "@/hooks/queries/use-recruiter";

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
  logo_url: string;
}

const emptyCompany = (): CompanyData => ({
  name: "",
  description: "",
  website: "",
  industry: "",
  size: "",
  location: "",
  culture: "",
  benefits: "",
  logo_url: "",
});

export default function CompanyProfilePage() {
  const { data: companyData, isLoading: loading } = useRecruiterCompany();
  const saveMutation = useSaveCompany();
  const uploadLogoMut = useUploadCompanyLogo();
  const removeLogoMut = useRemoveCompanyLogo();
  const [company, setCompany] = useState<CompanyData>(emptyCompany);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (companyData == null) {
      setCompany(emptyCompany());
      return;
    }
    const d = companyData as Record<string, unknown>;
    setCompany({
      id: d.id as string | undefined,
      name: (d.name as string) || "",
      description: (d.description as string) || "",
      website: (d.website as string) || "",
      industry: (d.industry as string) || "",
      size: (d.size as string) || "",
      location: (d.location as string) || "",
      culture: (d.culture as string) || "",
      benefits: (d.benefits as string) || "",
      logo_url: (d.logo_url as string) || "",
    });
  }, [companyData]);

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
      const { logo_url: _l, ...payload } = company;
      const result = await saveMutation.mutateAsync({
        ...payload,
        id: company.id,
      });
      const r = result as Record<string, unknown>;
      setCompany((prev) => ({
        ...prev,
        id: r.id as string | undefined,
        name: (r.name as string) ?? prev.name,
        description: (r.description as string) ?? prev.description,
        website: (r.website as string) ?? prev.website,
        industry: (r.industry as string) ?? prev.industry,
        size: (r.size as string) ?? prev.size,
        location: (r.location as string) ?? prev.location,
        culture: (r.culture as string) ?? prev.culture,
        benefits: (r.benefits as string) ?? prev.benefits,
        logo_url: (r.logo_url as string) ?? prev.logo_url,
      }));
      setSuccess("Company profile saved!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !company.id) return;
    try {
      await uploadLogoMut.mutateAsync({ companyId: company.id, file });
    } catch {
      /* toast optional */
    }
  }

  async function onRemoveLogo() {
    if (!company.id || !company.logo_url) return;
    if (!confirm("Remove company logo?")) return;
    try {
      await removeLogoMut.mutateAsync(company.id);
      setCompany((prev) => ({ ...prev, logo_url: "" }));
    } catch {
      /* ignore */
    }
  }

  const logoBusy = uploadLogoMut.isPending || removeLogoMut.isPending;

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Building2 className="h-7 w-7 text-indigo-600" />
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">Company Profile</h1>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-8 space-y-6">
        {company.id ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-slate-100">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {company.logo_url ? (
                <Image
                  src={company.logo_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <Building2 className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Company logo</p>
              <p className="text-xs text-slate-500 max-w-md">JPEG, PNG, or WebP — max 2MB. Shown on job posts.</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={logoBusy}
                    onChange={onPickLogo}
                  />
                  <span className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                    {logoBusy ? "Working…" : "Upload logo"}
                  </span>
                </label>
                {company.logo_url ? (
                  <button
                    type="button"
                    disabled={logoBusy}
                    onClick={() => void onRemoveLogo()}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Remove logo
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            Save your company details below first. You can upload a logo after the company is created.
          </p>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Company Name *</label>
          <input
            type="text"
            value={company.name}
            onChange={(e) => setCompany({ ...company, name: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
          <textarea
            value={company.description}
            onChange={(e) => setCompany({ ...company, description: e.target.value })}
            rows={4}
            placeholder="What does your company do?"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Website</label>
            <input
              type="url"
              value={company.website}
              onChange={(e) => setCompany({ ...company, website: e.target.value })}
              placeholder="https://..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Industry</label>
            <input
              type="text"
              value={company.industry}
              onChange={(e) => setCompany({ ...company, industry: e.target.value })}
              placeholder="Technology, Finance..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Company Size</label>
            <select
              value={company.size}
              onChange={(e) => setCompany({ ...company, size: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800"
            >
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
            <input
              type="text"
              value={company.location}
              onChange={(e) => setCompany({ ...company, location: e.target.value })}
              placeholder="Chennai, India"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Culture</label>
          <textarea
            value={company.culture}
            onChange={(e) => setCompany({ ...company, culture: e.target.value })}
            rows={3}
            placeholder="Describe your company culture..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Benefits</label>
          <textarea
            value={company.benefits}
            onChange={(e) => setCompany({ ...company, benefits: e.target.value })}
            rows={3}
            placeholder="Health insurance, flexible hours, remote work..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {error && <p className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {success && <p className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-8 py-3.5 font-medium disabled:opacity-50 w-full md:w-auto"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Profile
        </button>
      </form>
    </div>
  );
}
