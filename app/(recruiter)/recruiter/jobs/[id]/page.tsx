"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Loader2, Wand2, ArrowLeft, Trash2 } from "lucide-react";
import type { WorkType, EmploymentType, JobStatus } from "@/types/recruiter";
import { useRecruiterJob, useDeleteJob, recruiterKeys } from "@/hooks/queries/use-recruiter";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-fetcher";

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: jobData, isLoading: loading, error: loadError } = useRecruiterJob(id);
  const deleteMut = useDeleteJob();
  const queryClient = useQueryClient();
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
    if (loadError) { setError("Failed to load job"); return; }
    if (!jobData) return;
    const job = jobData as Record<string, unknown>;
    setTitle((job.title as string) || "");
    setDescription((job.description as string) || "");
    setRequirements((job.requirements as string) || "");
    setSkills(Array.isArray(job.skills_required) ? (job.skills_required as string[]).join(", ") : "");
    setExperienceMin(String(job.experience_min ?? 0));
    setExperienceMax(job.experience_max != null ? String(job.experience_max) : "");
    setSalaryMin(job.salary_min != null ? String(job.salary_min) : "");
    setSalaryMax(job.salary_max != null ? String(job.salary_max) : "");
    setSalaryCurrency((job.salary_currency as string) || "INR");
    setLocation((job.location as string) || "");
    setWorkType((job.work_type as WorkType) || "onsite");
    setEmploymentType((job.employment_type as EmploymentType) || "full_time");
    setStatus((job.status as JobStatus) || "draft");
    setApplicationCount((job.application_count as number) || 0);
  }, [jobData]);

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
      await apiFetch(`/api/recruiter/jobs/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: recruiterKeys.jobs() });
      setSuccess("Job updated!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await deleteMut.mutateAsync(id);
      router.push("/recruiter/jobs");
    } catch { setError("Something went wrong"); }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading job...</p>;

  return (
    <div className="max-w-3xl mx-auto w-full py-12 px-6 space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/recruiter/jobs")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 min-h-[44px]">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{applicationCount} application{applicationCount !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">Edit Job Posting</h1>
        <p className="text-slate-500 text-sm mb-10">Define your role and find your perfect candidate</p>
      </div>

      <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-[32px] p-8 sm:p-12 space-y-6">
        <div>
          <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Job Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Senior React Developer"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 placeholder:text-slate-400 appearance-none" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[13px] font-bold text-slate-700 block ml-1">Job Description *</label>
            <button type="button" onClick={generateDescription} disabled={aiLoading}
              className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 disabled:opacity-50">
              {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              AI Regenerate
            </button>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[160px] outline-none text-slate-900 appearance-none" />
        </div>

        <div>
          <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Requirements</label>
          <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={4}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all min-h-[160px] outline-none text-slate-900 appearance-none" />
        </div>

        <div>
          <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Required Skills (comma-separated)</label>
          <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 placeholder:text-slate-400 appearance-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Work Type</label>
            <select value={workType} onChange={(e) => setWorkType(e.target.value as WorkType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 appearance-none">
              <option value="onsite">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Employment Type</label>
            <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 appearance-none">
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as JobStatus)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 appearance-none">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Chennai, Remote"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 placeholder:text-slate-400 appearance-none" />
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Salary Currency</label>
            <input type="text" value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 appearance-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Exp Min (yrs)</label>
            <input type="number" value={experienceMin} onChange={(e) => setExperienceMin(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 appearance-none" />
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Exp Max (yrs)</label>
            <input type="number" value={experienceMax} onChange={(e) => setExperienceMax(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 appearance-none" />
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Salary Min</label>
            <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 appearance-none" />
          </div>
          <div>
            <label className="text-[13px] font-bold text-slate-700 mb-2 block ml-1">Salary Max</label>
            <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-slate-900 appearance-none" />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        {success && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">{success}</p>}

        <div className="flex items-center gap-4 pt-8 border-t border-slate-100">
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-10 py-4 font-bold transition-all disabled:opacity-50 w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save Changes
          </button>
          <button type="button" onClick={handleDelete}
            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-8 py-4 font-bold transition-all w-full sm:w-auto flex items-center justify-center gap-2">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
