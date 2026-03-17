"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2 } from "lucide-react";
import type { WorkType, EmploymentType } from "@/types/recruiter";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
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

  async function generateDescription() {
    if (!title.trim()) {
      setError("Enter a job title first");
      return;
    }
    setAiLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recruiter/jobs/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          experience_level: `${experienceMin}-${experienceMax || "any"} years`,
          work_type: workType,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDescription(data.description || "");
        if (data.requirements) setRequirements(data.requirements);
      } else {
        const data = await res.json();
        setError(data.error || "AI generation failed");
      }
    } catch {
      setError("Failed to generate description");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent, status: "draft" | "active") {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recruiter/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          requirements,
          skills_required: skills.split(",").map((s) => s.trim()).filter(Boolean),
          experience_min: parseInt(experienceMin) || 0,
          experience_max: experienceMax ? parseInt(experienceMax) : null,
          salary_min: salaryMin ? parseInt(salaryMin) : null,
          salary_max: salaryMax ? parseInt(salaryMax) : null,
          salary_currency: salaryCurrency,
          location,
          work_type: workType,
          employment_type: employmentType,
          status,
        }),
      });

      if (res.ok) {
        router.push("/recruiter/jobs");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create job");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-text">Post New Job</h1>

      <form className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-text">Job Title *</label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Senior React Developer"
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-text">Job Description *</label>
            <button
              type="button" onClick={generateDescription} disabled={aiLoading}
              className="flex items-center gap-1 rounded-lg bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
              AI Generate
            </button>
          </div>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            rows={8} placeholder="Describe the role, responsibilities, and what you're looking for..."
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Requirements</label>
          <textarea
            value={requirements} onChange={(e) => setRequirements(e.target.value)}
            rows={4} placeholder="Must-have qualifications, certifications..."
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text">Required Skills (comma-separated)</label>
          <input
            type="text" value={skills} onChange={(e) => setSkills(e.target.value)}
            placeholder="React, TypeScript, Node.js, AWS..."
            className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
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
            <label className="mb-1 block text-sm font-medium text-text">Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Chennai, Remote"
              className="w-full rounded-lg border border-gray-300 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none" />
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

        <div className="flex gap-3">
          <button type="button" onClick={(e) => handleSubmit(e, "active")} disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish Job
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, "draft")} disabled={loading}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-50">
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}
