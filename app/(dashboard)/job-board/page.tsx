"use client";

import { useState, useEffect, useCallback } from "react";
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
  // Data
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [page, setPage] = useState(1);

  // Detail / apply state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Apply form state
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");

  /* Fetch jobs */
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (location) params.set("location", location);
      if (workType) params.set("work_type", workType);
      if (employmentType) params.set("employment_type", employmentType);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, location, workType, employmentType, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /* Fetch user's existing applications to show "Applied" badges */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/jobs/applied");
        if (res.ok) {
          const ids: string[] = await res.json();
          setAppliedJobIds(new Set(ids));
        }
      } catch {
        // ignore -- user may not be logged in for public browsing
      }
    })();
  }, []);

  /* Fetch resumes when apply form opens */
  useEffect(() => {
    if (!showApplyForm) return;
    (async () => {
      try {
        const res = await fetch("/api/upload-resume");
        if (res.ok) {
          const data = await res.json();
          // Normalise: API may return array directly or { resumes: [...] }
          const list = Array.isArray(data) ? data : data.resumes || [];
          setResumes(list);
          if (list.length > 0) setSelectedResume(list[0].id);
        }
      } catch {
        // ignore
      }
    })();
  }, [showApplyForm]);

  /* Search on Enter or debounce */
  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  }

  /* Apply to a job */
  async function handleApply() {
    if (!selectedJob) return;
    setApplying(true);
    setApplyError("");

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: selectedResume || undefined,
          cover_letter: coverLetter || undefined,
        }),
      });

      if (res.ok) {
        setAppliedJobIds((prev) => new Set(prev).add(selectedJob.id));
        setShowApplyForm(false);
        setCoverLetter("");
        setSelectedResume("");
      } else {
        const err = await res.json();
        setApplyError(err.error || "Failed to apply");
      }
    } catch {
      setApplyError("Network error. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Job Board</h1>
        <p className="mt-1 text-xs sm:text-sm text-text-muted">
          Browse and apply to open positions from recruiters.
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearchSubmit} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search job titles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-background py-2.5 pl-10 pr-4 text-base sm:text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Location */}
          <div className="relative sm:w-52">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-background py-2.5 pl-10 pr-4 text-base sm:text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80"
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
            className="min-h-[44px] rounded-xl border border-gray-200 bg-background px-3 py-2 text-base sm:text-sm text-text"
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
            className="min-h-[44px] rounded-xl border border-gray-200 bg-background px-3 py-2 text-base sm:text-sm text-text"
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
              className="min-h-[44px] flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-text-muted hover:text-text active:bg-gray-100"
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => {
                setSelectedJob(job);
                setShowApplyForm(false);
              }}
              className="group relative rounded-xl border border-gray-200 bg-card p-3 sm:p-5 text-left shadow-sm transition-shadow hover:shadow-md active:bg-gray-50"
            >
              {/* Applied badge */}
              {appliedJobIds.has(job.id) && (
                <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Applied
                </span>
              )}

              {/* Company */}
              {job.companies && (
                <div className="mb-2 flex items-center gap-2">
                  {job.companies.logo_url ? (
                    <img
                      src={job.companies.logo_url}
                      alt=""
                      className="h-6 w-6 rounded object-cover"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-text-muted" />
                  )}
                  <span className="text-xs font-medium text-text-muted">
                    {job.companies.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h3 className="text-sm sm:text-base font-semibold text-text group-hover:text-primary truncate">
                {job.title}
              </h3>

              {/* Meta row */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </span>
                )}
                {job.work_type && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {WORK_TYPE_LABELS[job.work_type] || job.work_type}
                  </span>
                )}
                {job.employment_type && (
                  <span>{EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type}</span>
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
              <p className="mt-3 flex items-center gap-1 text-xs text-text-muted">
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
          className="fixed inset-0 z-50 flex items-start sm:items-start justify-center overflow-y-auto bg-black/50 p-0 sm:p-4 sm:pt-16"
          onClick={() => {
            setSelectedJob(null);
            setShowApplyForm(false);
          }}
        >
          <div
            className="relative w-full max-w-2xl sm:rounded-2xl border border-gray-200 bg-card p-4 sm:p-6 shadow-xl min-h-screen sm:min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => {
                setSelectedJob(null);
                setShowApplyForm(false);
              }}
              className="absolute right-4 top-4 rounded-lg p-1 text-text-muted hover:bg-gray-100 hover:text-text"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Company header */}
            {selectedJob.companies && (
              <div className="mb-3 flex items-center gap-2">
                {selectedJob.companies.logo_url ? (
                  <img
                    src={selectedJob.companies.logo_url}
                    alt=""
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-text-muted" />
                )}
                <div>
                  <span className="text-sm font-medium text-text">
                    {selectedJob.companies.name}
                  </span>
                  {selectedJob.companies.industry && (
                    <span className="ml-2 text-xs text-text-muted">
                      {selectedJob.companies.industry}
                    </span>
                  )}
                </div>
              </div>
            )}

            <h2 className="text-lg sm:text-xl font-bold text-text">{selectedJob.title}</h2>

            {/* Meta */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-muted">
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
              <p className="mt-3 text-base font-semibold text-text">
                {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency)}
              </p>
            )}

            {/* Experience */}
            {(selectedJob.experience_min != null || selectedJob.experience_max != null) && (
              <p className="mt-1 text-sm text-text-muted">
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
                <h4 className="mb-1.5 text-sm font-medium text-text">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.skills_required.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-4">
              <h4 className="mb-1 text-sm font-medium text-text">Description</h4>
              <div className="prose prose-sm max-w-none text-text-muted whitespace-pre-wrap">
                {selectedJob.description}
              </div>
            </div>

            {/* Requirements */}
            {selectedJob.requirements && (
              <div className="mt-4">
                <h4 className="mb-1 text-sm font-medium text-text">Requirements</h4>
                <div className="prose prose-sm max-w-none text-text-muted whitespace-pre-wrap">
                  {selectedJob.requirements}
                </div>
              </div>
            )}

            {/* Action area */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              {appliedJobIds.has(selectedJob.id) ? (
                <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-5 w-5" />
                  You have already applied to this position.
                </div>
              ) : !showApplyForm ? (
                <button
                  onClick={() => setShowApplyForm(true)}
                  className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80"
                >
                  <FileText className="h-4 w-4" />
                  Apply Now
                </button>
              ) : (
                /* Apply form */
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-text">Submit your application</h4>

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
                        className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-background px-3 py-2 text-base sm:text-sm text-text"
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
                      className="w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {applyError && (
                    <p className="text-sm text-red-600">{applyError}</p>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 active:bg-primary/80 disabled:opacity-60"
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
                      className="min-h-[44px] rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-text-muted hover:text-text active:bg-gray-100"
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
