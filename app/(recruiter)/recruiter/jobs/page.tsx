"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Briefcase, MapPin, Users, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import type { JobPosting } from "@/types/recruiter";
import { WORK_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS } from "@/types/recruiter";
import { useRecruiterJobs, useToggleJobStatus, useDeleteJob } from "@/hooks/queries/use-recruiter";

export default function JobsPage() {
  const [filter, setFilter] = useState<string>("all");

  const { data: jobsRaw, isLoading: loading } = useRecruiterJobs();
  const jobs = (jobsRaw ?? []) as JobPosting[];
  const toggleMutation = useToggleJobStatus();
  const deleteMut = useDeleteJob();

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  async function toggleStatus(job: JobPosting) {
    const newStatus = job.status === "active" ? "paused" : "active";
    await toggleMutation.mutateAsync({ id: job.id, status: newStatus });
  }

  async function deleteJob(id: string) {
    await deleteMut.mutateAsync(id);
  }

  return (
    <div className="max-w-5xl mx-auto w-full py-10 px-6">
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Job Postings</h1>
        <Link
          href="/recruiter/jobs/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 rounded-xl px-6 py-3 font-bold transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> New Job
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-slate-200/60">
        {["all", "active", "paused", "draft", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filter === s
                ? "px-4 py-2 rounded-xl text-xs font-bold bg-white text-indigo-600 shadow-sm border border-slate-200/50"
                : "px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 transition-all"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto w-full">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] py-20 text-center">
            <Briefcase className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="font-display text-slate-400 font-medium">No jobs found. Create your first job posting.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job) => (
              <div key={job.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-4 flex items-center justify-between group hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 w-full">
                  <div className="flex-1 min-w-0">
                    <Link href={`/recruiter/jobs/${job.id}`} className="font-display text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                      {job.title}
                    </Link>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-medium mt-1">
                      {job.location && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                      )}
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {WORK_TYPE_LABELS[job.work_type]}</span>
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {EMPLOYMENT_TYPE_LABELS[job.employment_type]}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {job.application_count} applicants</span>
                    </div>
                    {(job.salary_min || job.salary_max) && (
                      <p className="mt-1 text-xs text-green-600">
                        {job.salary_currency} {job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mr-4 ${
                      job.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      job.status === "paused" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      job.status === "closed" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                      "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}>
                      {job.status}
                    </span>

                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleStatus(job)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                      {job.status === "active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <Link href={`/recruiter/jobs/${job.id}`} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button onClick={() => deleteJob(job.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
