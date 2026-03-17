"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Briefcase, MapPin, Users, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import type { JobPosting } from "@/types/recruiter";
import { WORK_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS } from "@/types/recruiter";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/recruiter/jobs")
      .then((r) => (r.ok ? r.json() : []))
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  async function toggleStatus(job: JobPosting) {
    const newStatus = job.status === "active" ? "paused" : "active";
    const res = await fetch(`/api/recruiter/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
    }
  }

  async function deleteJob(id: string) {
    const res = await fetch(`/api/recruiter/jobs/${id}`, { method: "DELETE" });
    if (res.ok) setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-text">Job Postings</h1>
        <Link
          href="/recruiter/jobs/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Job
        </Link>
      </div>

      <div className="flex gap-2">
        {["all", "active", "paused", "draft", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              filter === s ? "bg-primary text-white" : "bg-gray-100 text-text-muted hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-text-muted">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <Briefcase className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-muted">No jobs found. Create your first job posting.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div key={job.id} className="rounded-xl border border-gray-200 bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <Link href={`/recruiter/jobs/${job.id}`} className="text-base font-semibold text-text hover:text-primary">
                    {job.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    {job.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                    )}
                    <span>{WORK_TYPE_LABELS[job.work_type]}</span>
                    <span>{EMPLOYMENT_TYPE_LABELS[job.employment_type]}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {job.application_count} applicants</span>
                  </div>
                  {(job.salary_min || job.salary_max) && (
                    <p className="mt-1 text-xs text-green-600">
                      {job.salary_currency} {job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    job.status === "active" ? "bg-green-100 text-green-700" :
                    job.status === "paused" ? "bg-yellow-100 text-yellow-700" :
                    job.status === "closed" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {job.status}
                  </span>

                  <button onClick={() => toggleStatus(job)} className="rounded p-1 text-text-muted hover:text-primary">
                    {job.status === "active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <Link href={`/recruiter/jobs/${job.id}`} className="rounded p-1 text-text-muted hover:text-primary">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button onClick={() => deleteJob(job.id)} className="rounded p-1 text-text-muted hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
