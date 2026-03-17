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

  if (loading) return <p className="text-sm text-text-muted">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-text">Company Profile</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Company Name *</label>
          <input type="text" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })}
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Description</label>
          <textarea value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })}
            rows={4} placeholder="What does your company do?"
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Website</label>
            <input type="url" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })}
              placeholder="https://..." className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Industry</label>
            <input type="text" value={company.industry} onChange={(e) => setCompany({ ...company, industry: e.target.value })}
              placeholder="Technology, Finance..." className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Company Size</label>
            <select value={company.size} onChange={(e) => setCompany({ ...company, size: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none">
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
            <label className="mb-1 block text-sm font-medium text-text">Location</label>
            <input type="text" value={company.location} onChange={(e) => setCompany({ ...company, location: e.target.value })}
              placeholder="Chennai, India" className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Culture</label>
          <textarea value={company.culture} onChange={(e) => setCompany({ ...company, culture: e.target.value })}
            rows={3} placeholder="Describe your company culture..."
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Benefits</label>
          <textarea value={company.benefits} onChange={(e) => setCompany({ ...company, benefits: e.target.value })}
            rows={3} placeholder="Health insurance, flexible hours, remote work..."
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none" />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">{success}</p>}

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Profile
        </button>
      </form>
    </div>
  );
}
