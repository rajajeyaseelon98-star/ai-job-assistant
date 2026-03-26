"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MapPin,
  Briefcase,
  Building2,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  CheckCircle2,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <div className="h-20 animate-pulse rounded bg-slate-100" />,
  ssr: false,
});
import { useJobs, useAppliedJobIds, useJobBoardResumes, useApplyToJob } from "@/hooks/queries/use-job-board";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  location: string | null;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  skills_required: string[] | null;
  experience_min: number | null;
  experience_max: number | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  location: string | null;
  work_type: string | null;
  employment_type: string | null;
  application_count: number | null;
  created_at: string;
  companies: Company | null;
}

interface Resume {
  id: string;
  file_name: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatSalary(min: number | null, max: number | null, currency: string | null) {
  if (!min && !max) return null;
  const cur = currency || "USD";
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const WORK_TYPE_LABELS: Record<string, string> = {
  onsite: "On-site",
  remote: "Remote",
  hybrid: "Hybrid",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function JobBoardPage() {
  // Filters
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [page, setPage] = useState(1);

  // Detail / apply state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Apply form state
  const [selectedResume, setSelectedResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");

  // TanStack Query hooks
  const filters = { search, location, workType, employmentType, page };
  const { data: jobsData, isLoading: loading } = useJobs(filters);
  const { data: appliedIds = [] } = useAppliedJobIds();
  const { data: resumes = [] } = useJobBoardResumes(showApplyForm);
  const applyMutation = useApplyToJob();

  useEffect(() => {
    if (resumes.length > 0 && !selectedResume) {
      setSelectedResume(resumes[0].id);
    }
  }, [resumes, selectedResume]);

  const jobs = jobsData?.jobs ?? [];
  const total = jobsData?.total ?? 0;
  const totalPages = jobsData?.totalPages ?? 0;
  const appliedJobIds = useMemo(() => new Set(appliedIds), [appliedIds]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  async function handleApply() {
    if (!selectedJob) return;
    setApplying(true);
    setApplyError("");

    try {
      await applyMutation.mutateAsync({
        jobId: selectedJob.id,
        resumeId: selectedResume || undefined,
        coverLetter: coverLetter || undefined,
      });
      setShowApplyForm(false);
      setCoverLetter("");
      setSelectedResume("");
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 py-8 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-slate-900">Job Board</h1>
        <p className="mb-8 text-base leading-relaxed text-slate-500">
          Browse and apply to open positions from recruiters.
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} className="mb-8 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search job titles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-10 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Location */}
          <div className="relative sm:w-52">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pl-10 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>

        {/* Dropdowns row */}
        <div className="flex flex-wrap gap-3">
          <select
            value={workType}
            onChange={(e) => {
              setWorkType(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 sm:w-auto"
          >
            <option value="">All work types</option>
            {Object.entries(WORK_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={employmentType}
            onChange={(e) => {
              setEmploymentType(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 sm:w-auto"
          >
            <option value="">All employment types</option>
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          {(search || location || workType || employmentType) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setLocation("");
                setWorkType("");
                setEmploymentType("");
                setPage(1);
              }}
              className="min-h-[44px] flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </form>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-text-muted">
          {total} job{total !== 1 ? "s" : ""} found
        </p>
      )}

      {/* Job grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-text-muted">Loading jobs...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-card px-6 py-16 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-text-muted" />
          <p className="mt-3 text-sm text-text-muted">
            No jobs found. Try adjusting your filters.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => {
                setSelectedJob(job);
                setShowApplyForm(false);
              }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left transition-all duration-200 hover:border-indigo-300 hover:shadow-md"
            >
              {/* Applied badge */}
              {appliedJobIds.has(job.id) && (
                <span className="absolute right-6 top-6 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Applied
                </span>
              )}

              {/* Company */}
              {job.companies && (
                <div className="mb-2 flex items-center gap-2">
                  {job.companies.logo_url ? (
                    <Image
                      src={job.companies.logo_url}
                      alt=""
                      width={24}
                      height={24}
                      unoptimized
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-slate-400" />
                  )}
                  <span className="text-xs font-medium text-slate-500">
                    {job.companies.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h3 className="mb-2 truncate font-display text-xl font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                {job.title}
              </h3>

              {/* Meta row */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {job.location && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </span>
                )}
                {job.work_type && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    <Briefcase className="h-3.5 w-3.5" />
                    {WORK_TYPE_LABELS[job.work_type] || job.work_type}
                  </span>
                )}
                {job.employment_type && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}
                  </span>
                )}
              </div>

              {/* Salary */}
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency) && (
                <p className="mt-2 text-xs sm:text-sm font-medium text-text">
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                </p>
              )}

              {/* Skills */}
              {job.skills_required && job.skills_required.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills_required.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills_required.length > 5 && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-text-muted">
                      +{job.skills_required.length - 5}
                    </span>
                  )}
                </div>
              )}

              {/* Posted date */}
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {timeAgo(job.created_at)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="min-h-[44px] flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-text disabled:opacity-40 active:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>
          <span className="text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="min-h-[44px] flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-text disabled:opacity-40 active:bg-gray-100"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Job detail modal                                             */}
      {/* ============================================================ */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => {
            setSelectedJob(null);
            setShowApplyForm(false);
          }}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/90 px-8 py-6 backdrop-blur-md">
              <div>
                {/* Company header */}
                {selectedJob.companies && (
                  <div className="mb-3 flex items-center gap-2">
                {selectedJob.companies.logo_url ? (
                  <Image
                    src={selectedJob.companies.logo_url}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-slate-400" />
                )}
                <div>
                  <span className="text-sm font-medium text-slate-900">
                    {selectedJob.companies.name}
                  </span>
                  {selectedJob.companies.industry && (
                    <span className="ml-2 text-xs text-slate-500">
                      {selectedJob.companies.industry}
                    </span>
                  )}
                </div>
              </div>
                )}
                <h2 className="mb-2 font-display text-2xl font-bold text-slate-900">{selectedJob.title}</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedJob(null);
                  setShowApplyForm(false);
                }}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

              <div className="prose prose-slate prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 max-w-none whitespace-pre-wrap overflow-y-auto p-8">
            {/* Meta */}
            <div className="mt-0 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
              {selectedJob.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {selectedJob.location}
                </span>
              )}
              {selectedJob.work_type && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />{" "}
                  {WORK_TYPE_LABELS[selectedJob.work_type] || selectedJob.work_type}
                </span>
              )}
              {selectedJob.employment_type && (
                <span>
                  {EMPLOYMENT_TYPE_LABELS[selectedJob.employment_type] || selectedJob.employment_type}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Posted {timeAgo(selectedJob.created_at)}
              </span>
            </div>

            {/* Salary */}
            {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency) && (
              <p className="mt-3 text-base font-semibold text-slate-900">
                {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency)}
              </p>
            )}

            {/* Experience */}
            {(selectedJob.experience_min != null || selectedJob.experience_max != null) && (
              <p className="mt-1 text-sm text-slate-500">
                Experience:{" "}
                {selectedJob.experience_min != null && selectedJob.experience_max != null
                  ? `${selectedJob.experience_min}-${selectedJob.experience_max} years`
                  : selectedJob.experience_min != null
                    ? `${selectedJob.experience_min}+ years`
                    : `Up to ${selectedJob.experience_max} years`}
              </p>
            )}

            {/* Skills */}
            {selectedJob.skills_required && selectedJob.skills_required.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-1.5 text-sm font-medium text-slate-900">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skills_required.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-sm text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-4">
              <h4 className="mb-1 text-sm font-medium text-slate-900">Description</h4>
              {selectedJob.description ? (
                <div className="prose prose-slate prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 max-w-none whitespace-pre-wrap">
                  <ReactMarkdown>{selectedJob.description}</ReactMarkdown>
                </div>
              ) : null}
            </div>

            {/* Requirements */}
            {selectedJob.requirements && (
              <div className="mt-4">
                <h4 className="mb-1 text-sm font-medium text-slate-900">Requirements</h4>
                {selectedJob.requirements ? (
                  <div className="prose prose-slate prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 max-w-none whitespace-pre-wrap">
                    <ReactMarkdown>{selectedJob.requirements}</ReactMarkdown>
                  </div>
                ) : null}
              </div>
            )}
            </div>

            {/* Action area */}
            <div className="sticky bottom-0 z-10 flex items-center justify-end border-t border-slate-100 bg-slate-50 px-8 py-5">
              {appliedJobIds.has(selectedJob.id) ? (
                <div className="flex w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  You have already applied to this position.
                </div>
              ) : !showApplyForm ? (
                <button
                  onClick={() => setShowApplyForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3 font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-violet-700"
                >
                  <FileText className="h-4 w-4" />
                  Apply Now
                </button>
              ) : (
                /* Apply form */
                <div className="w-full space-y-4">
                  <h4 className="text-sm font-semibold text-slate-900">Submit your application</h4>

                  {/* Resume select */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-muted">
                      Resume (optional)
                    </label>
                    {resumes.length === 0 ? (
                      <p className="text-xs text-text-muted">
                        No resumes uploaded.{" "}
                        <a href="/resume-analyzer" className="text-primary underline">
                          Upload one first
                        </a>
                        .
                      </p>
                    ) : (
                      <select
                        value={selectedResume}
                        onChange={(e) => setSelectedResume(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">No resume</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.file_name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Cover letter */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-muted">
                      Cover letter (optional)
                    </label>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={5}
                      maxLength={5000}
                      placeholder="Write a brief cover letter..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  {applyError && (
                    <p className="text-sm text-red-600">{applyError}</p>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60"
                    >
                      {applying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {applying ? "Submitting..." : "Submit Application"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApplyForm(false)}
                      className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
