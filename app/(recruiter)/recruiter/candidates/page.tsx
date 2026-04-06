"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  User,
  MapPin,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { useRecruiterCandidatesSearch } from "@/hooks/queries/use-recruiter";
import { formatApiFetchThrownError } from "@/lib/api-error";

const PAGE_SIZE = 25;

export default function CandidateSearchPage() {
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [location, setLocation] = useState("");
  const [filtersApplied, setFiltersApplied] = useState(false);
  /** Drives the query: only changes on mount, Apply, Clear, or pagination (matches previous fetchList behavior). */
  const [listParams, setListParams] = useState({
    page: 1,
    skills: "",
    experience: "",
    location: "",
  });

  const queryInput = useMemo(
    () => ({
      page: listParams.page,
      pageSize: PAGE_SIZE,
      skills: listParams.skills,
      experience: listParams.experience,
      location: listParams.location,
    }),
    [listParams]
  );

  const { data, isLoading, isFetching, isError, error } =
    useRecruiterCandidatesSearch(queryInput);

  const results = data?.candidates ?? [];
  const page = data?.page ?? listParams.page;
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const truncated = !!data?.truncated;
  const loading = isLoading || isFetching;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFiltersApplied(true);
    setListParams({ page: 1, skills, experience, location });
  }

  function handleClearFilters() {
    setSkills("");
    setExperience("");
    setLocation("");
    setFiltersApplied(false);
    setListParams({ page: 1, skills: "", experience: "", location: "" });
  }

  function goToPage(next: number) {
    const clamped = Math.max(1, Math.min(next, totalPages));
    setListParams({ page: clamped, skills, experience, location });
  }

  const summaryLoading = isLoading && results.length === 0;
  const fetchError = isError && error ? formatApiFetchThrownError(error) : null;

  return (
    <div className="max-w-5xl mx-auto w-full py-12 px-6">
      <h1 className="font-display text-4xl font-extrabold text-slate-900 tracking-tight mb-3">Candidate Search</h1>
      <p className="text-slate-500 text-lg mb-10 max-w-2xl">
        Browse job seeker profiles (with or without a resume). Results are paginated (up to 100 per page; this screen
        uses {PAGE_SIZE}). Skill and location filters match against a{" "}
        <span className="whitespace-nowrap">short resume text preview</span> when a resume exists (first ~500 characters
        of parsed text). The API scans up to 5,000 profiles per request, then applies filters — if you hit the cap, try
        narrowing skills or location.
      </p>

      <form onSubmit={handleSearch} className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[32px] p-8 sm:p-10 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-6">
          <div className="lg:col-span-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Skills</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, Node.js, Python..."
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 appearance-none"
            />
          </div>
          <div className="lg:col-span-3">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Experience Level</label>
            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 appearance-none"
            >
              <option value="">Any</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead</option>
            </select>
          </div>
          <div className="lg:col-span-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Chennai, Remote..."
              className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 w-full focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 appearance-none"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-0">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 rounded-2xl py-4 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Apply filters
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
            className="sm:w-auto px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Show all
          </button>
        </div>
      </form>

      {fetchError ? (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {fetchError}
        </p>
      ) : null}

      <div className="border-t border-slate-100 pt-12">
        <h2 className="font-display text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          {summaryLoading
            ? "Loading…"
            : filtersApplied
              ? `${total} candidate${total === 1 ? "" : "s"} match your filters`
              : `${total} candidate${total === 1 ? "" : "s"}`}
        </h2>
        {!filtersApplied && !loading && (
          <p className="text-sm text-slate-500 mb-2">
            Page {page} of {totalPages} · {PAGE_SIZE} per page
            {truncated ? " · List may be incomplete: many profiles exist; increase scan limit in API if needed." : ""}
          </p>
        )}
        {filtersApplied && !loading && (
          <p className="text-sm text-slate-500 mb-2">
            Page {page} of {totalPages} · {total} match{total === 1 ? "" : "es"} total
            {truncated ? " · Scan cap reached; some profiles may be excluded." : ""}
          </p>
        )}

        {summaryLoading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading candidates…</span>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[32px] py-32 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white text-slate-200 rounded-3xl flex items-center justify-center shadow-sm mb-6">
              <User className="h-9 w-9" />
            </div>
            <p className="font-display text-slate-400 font-medium text-lg">
              {filtersApplied ? "No candidates found" : "No candidates yet"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {filtersApplied
                ? "No candidates match your current filters."
                : "No job seeker profiles found in the scanned range."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {results.map((c) => (
                <div
                  key={c.id}
                  className="group bg-white border border-slate-200 rounded-2xl p-5 mb-4 hover:shadow-md hover:border-indigo-200 transition-all flex justify-between items-stretch gap-3"
                >
                  <Link
                    href={`/recruiter/candidates/${c.id}`}
                    className="flex gap-4 items-center min-w-0 flex-1 min-h-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="bg-slate-50 text-slate-400 w-12 h-12 rounded-xl flex items-center justify-center">
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">{c.name || c.email}</h3>
                            {c.has_resume === false && (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200/80">
                                No resume
                              </span>
                            )}
                          </div>
                          {c.name && <p className="text-xs text-slate-500">{c.email}</p>}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        {c.experience_level && (
                          <span className="flex items-center gap-1 capitalize">
                            <Briefcase className="h-3 w-3" /> {c.experience_level}
                          </span>
                        )}
                        {c.preferred_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {c.preferred_location}
                          </span>
                        )}
                        {c.preferred_role && <span>Wants: {c.preferred_role}</span>}
                        {c.salary_expectation && <span>Salary: {c.salary_expectation}</span>}
                      </div>
                      {c.resume_preview ? (
                        <p className="mt-2 text-xs text-slate-500 line-clamp-2">{c.resume_preview}</p>
                      ) : c.has_resume ? (
                        <p className="mt-2 text-xs text-slate-400 italic">Resume on file, no extractable text yet.</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {c.preferred_role && (
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded">{c.preferred_role}</span>
                      )}
                      {c.experience_level && (
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded">{c.experience_level}</span>
                      )}
                    </div>
                  </Link>
                  <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:flex-row sm:items-center">
                    <Link
                      href={`/recruiter/messages?compose=1&receiver_id=${encodeURIComponent(c.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </Link>
                    <Link
                      href={`/recruiter/candidates/${c.id}`}
                      className="flex items-center text-slate-300 transition group-hover:text-indigo-500"
                      aria-label="View profile"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-8">
              <p className="text-sm text-slate-600">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                {loading ? " · Loading…" : ""}
              </p>
              {totalPages > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToPage(page - 1)}
                    disabled={loading || page <= 1}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-slate-500 px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToPage(page + 1)}
                    disabled={loading || page >= totalPages}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
