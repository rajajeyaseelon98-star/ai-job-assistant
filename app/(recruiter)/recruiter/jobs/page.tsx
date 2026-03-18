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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">Job Postings</h1>
        <Link
          href="/recruiter/jobs/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 min-h-[44px] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> New Job
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "active", "paused", "draft", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize min-h-[44px] sm:min-h-0 ${
              filter === s ? "bg-primary text-white" : "bg-gray-100 text-text-muted hover:bg-gray-200 active:bg-gray-300"
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
            <div key={job.id} className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex-1 min-w-0">
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

                <div className="flex items-center gap-2 self-start">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    job.status === "active" ? "bg-green-100 text-green-700" :
                    job.status === "paused" ? "bg-yellow-100 text-yellow-700" :
                    job.status === "closed" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {job.status}
                  </span>

                  <button onClick={() => toggleStatus(job)} className="rounded p-2 sm:p-1 text-text-muted hover:text-primary min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                    {job.status === "active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <Link href={`/recruiter/jobs/${job.id}`} className="rounded p-2 sm:p-1 text-text-muted hover:text-primary min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button onClick={() => deleteJob(job.id)} className="rounded p-2 sm:p-1 text-text-muted hover:text-red-500 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
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
