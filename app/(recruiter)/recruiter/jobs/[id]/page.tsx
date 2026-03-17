"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Loader2, Wand2, ArrowLeft, Trash2 } from "lucide-react";
import type { WorkType, EmploymentType, JobStatus } from "@/types/recruiter";

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceMin, setExperienceMin] = useState("0");
  const [experienceMax, setExperienceMax] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("INR");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState<WorkType>("onsite");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("full_time");
  const [status, setStatus] = useState<JobStatus>("draft");
  const [applicationCount, setApplicationCount] = useState(0);

  useEffect(() => {
    fetch(`/api/recruiter/jobs/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((job) => {
        if (!job) { setError("Job not found"); return; }
        setTitle(job.title || "");
        setDescription(job.description || "");
        setRequirements(job.requirements || "");
        setSkills(Array.isArray(job.skills_required) ? job.skills_required.join(", ") : "");
        setExperienceMin(String(job.experience_min ?? 0));
        setExperienceMax(job.experience_max != null ? String(job.experience_max) : "");
        setSalaryMin(job.salary_min != null ? String(job.salary_min) : "");
        setSalaryMax(job.salary_max != null ? String(job.salary_max) : "");
        setSalaryCurrency(job.salary_currency || "INR");
        setLocation(job.location || "");
        setWorkType(job.work_type || "onsite");
        setEmploymentType(job.employment_type || "full_time");
        setStatus(job.status || "draft");
        setApplicationCount(job.application_count || 0);
      })
      .catch(() => setError("Failed to load job"))
      .finally(() => setLoading(false));
  }, [id]);

  async function generateDescription() {
    if (!title.trim()) { setError("Enter a job title first"); return; }
    setAiLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recruiter/jobs/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          work_type: workType,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDescription(data.description || "");
      } else {
        const data = await res.json();
        setError(data.error || "AI generation failed");
      }
    } catch { setError("Failed to generate description"); }
    finally { setAiLoading(false); }
  }

  async function handleSave() {
    if (!title.trim() || !description.trim()) { setError("Title and description are required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/recruiter/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, requirements,
          skills_required: skills.split(",").map((s) => s.trim()).filter(Boolean),
          experience_min: parseInt(experienceMin) || 0,
          experience_max: experienceMax ? parseInt(experienceMax) : null,
          salary_min: salaryMin ? parseInt(salaryMin) : null,
          salary_max: salaryMax ? parseInt(salaryMax) : null,
          salary_currency: salaryCurrency,
          location, work_type: workType, employment_type: employmentType, status,
        }),
      });
      if (res.ok) {
        setSuccess("Job updated!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update");
      }
    } catch { setError("Something went wrong"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    try {
      const res = await fetch(`/api/recruiter/jobs/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/recruiter/jobs");
      else setError("Failed to delete job");
    } catch { setError("Something went wrong"); }
  }

  if (loading) return <p className="text-sm text-text-muted">Loading job...</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/recruiter/jobs")} className="flex items-center gap-1 text-sm text-text-muted hover:text-text">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </button>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{applicationCount} application{applicationCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-text">Edit Job Posting</h1>

      <div className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Job Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Senior React Developer"
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-text">Job Description *</label>
            <button type="button" onClick={generateDescription} disabled={aiLoading}
              className="flex items-center gap-1 rounded-lg bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 disabled:opacity-50">
              {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              AI Regenerate
            </button>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8}
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Requirements</label>
          <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={4}
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Required Skills (comma-separated)</label>
          <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js..."
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Work Type</label>
            <select value={workType} onChange={(e) => setWorkType(e.target.value as WorkType)}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none">
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Employment Type</label>
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none">
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Chennai, Remote"
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Salary Currency</label>
            <input type="text" value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Exp Min (yrs)</label>
            <input type="number" value={experienceMin} onChange={(e) => setExperienceMin(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Exp Max (yrs)</label>
            <input type="number" value={experienceMax} onChange={(e) => setExperienceMax(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Salary Min</label>
            <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Salary Max</label>
            <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none" />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">{success}</p>}

        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
          <button type="button" onClick={handleDelete}
            className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
