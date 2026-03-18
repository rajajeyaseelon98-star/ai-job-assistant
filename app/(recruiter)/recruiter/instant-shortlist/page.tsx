"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Zap,
  Search,
  Users,
  Star,
  Send,
  CheckCircle,
  Clock,
} from "lucide-react";

interface ShortlistCandidate {
  user_id: string;
  name: string;
  headline: string | null;
  match_score: number;
  skill_overlap: string[];
  missing_skills: string[];
  profile_strength: number;
  rank_score: number;
  is_boosted: boolean;
}

interface JobPosting {
  id: string;
  title: string;
  skills_required: string[] | null;
  experience_min: number | null;
  experience_max: number | null;
  location: string | null;
}

export default function InstantShortlistPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [candidates, setCandidates] = useState<ShortlistCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [totalSearched, setTotalSearched] = useState(0);
  const [sentPushes, setSentPushes] = useState<Set<string>>(new Set());
  const [pushLoading, setPushLoading] = useState<string | null>(null);

  // Load recruiter's jobs
  useEffect(() => {
    fetch("/api/recruiter/jobs")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setJobs(data.filter((j: JobPosting) => j.skills_required?.length)))
      .catch(() => {})
      .finally(() => setJobsLoading(false));
  }, []);

  async function findCandidates() {
    const job = jobs.find((j) => j.id === selectedJob);
    if (!job || !job.skills_required?.length) return;

    setLoading(true);
    setCandidates([]);
    try {
      const res = await fetch("/api/recruiter/instant-shortlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: job.title,
          skills_required: job.skills_required,
          experience_min: job.experience_min,
          experience_max: job.experience_max,
          location: job.location,
          limit: 10,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
        setSearchTime(data.search_time_ms || 0);
        setTotalSearched(data.total_searched || 0);
      }
    } catch {
      // handle error silently
    } finally {
      setLoading(false);
    }
  }

  async function sendPush(candidateId: string) {
    const job = jobs.find((j) => j.id === selectedJob);
    if (!job) return;

    setPushLoading(candidateId);
    try {
      const res = await fetch("/api/recruiter/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          push_type: "shortlisted",
          title: `Shortlisted for ${job.title}`,
          message: `You've been shortlisted for ${job.title}! We'd love to connect with you.`,
          job_id: job.id,
        }),
      });
      if (res.ok) {
        setSentPushes((prev) => new Set([...prev, candidateId]));
      }
    } catch {
      // handle silently
    } finally {
      setPushLoading(null);
    }
  }

  async function messageAll() {
    for (const c of candidates) {
      if (!sentPushes.has(c.user_id)) {
        await sendPush(c.user_id);
      }
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-text sm:text-2xl lg:text-3xl">
          <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
          Instant Shortlist
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Top candidates matched in seconds -- not hours
        </p>
      </div>

      {/* Job Selector */}
      <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-text">
          <Search className="h-4 w-4" />
          Select a Job Posting
        </h2>
        {jobsLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        ) : jobs.length === 0 ? (
          <p className="text-sm text-text-muted">No job postings with skills found. Post a job with required skills first.</p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 bg-background px-3 py-2 text-base sm:text-sm text-text min-h-[44px]"
            >
              <option value="">Choose a job...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.skills_required?.length || 0} skills)
                </option>
              ))}
            </select>
            <button
              onClick={findCandidates}
              disabled={!selectedJob || loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover active:bg-primary/80 disabled:opacity-50 min-h-[44px] w-full sm:w-auto"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Find Candidates
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {candidates.length > 0 && (
        <>
          {/* Results Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border-2 border-green-200 bg-green-50 p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg">
                🔥
              </div>
              <div>
                <p className="font-bold text-green-800">
                  {candidates.length} Perfect Candidates Found
                </p>
                <p className="text-xs text-green-600">
                  Searched {totalSearched} candidates in {searchTime}ms
                </p>
              </div>
            </div>
            <button
              onClick={messageAll}
              className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 active:bg-green-800 min-h-[44px] w-full sm:w-auto"
            >
              <Send className="h-4 w-4" />
              Message All
            </button>
          </div>

          {/* Candidate Cards */}
          <div className="space-y-3">
            {candidates.map((c, i) => (
              <div
                key={c.user_id}
                className={`rounded-xl border bg-card p-3 sm:p-4 md:p-5 ${
                  c.is_boosted ? "border-yellow-300 bg-yellow-50/30" : "border-gray-200"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      #{i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-text">{c.name}</span>
                        {c.is_boosted && (
                          <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                            <Star className="h-3 w-3" /> Boosted
                          </span>
                        )}
                      </div>
                      {c.headline && <p className="text-sm text-text-muted truncate">{c.headline}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 self-end sm:self-start">
                    <div className="text-xl font-bold text-primary sm:text-2xl">{c.match_score}%</div>
                    <div className="text-[10px] text-text-muted">match</div>
                  </div>
                </div>

                {/* Skill Match */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.skill_overlap.map((s) => (
                    <span key={s} className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-700">
                      ✓ {s}
                    </span>
                  ))}
                  {c.missing_skills.slice(0, 3).map((s) => (
                    <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-400">
                      — {s}
                    </span>
                  ))}
                </div>

                {/* Score Breakdown */}
                <div className="mt-3 flex flex-wrap gap-3 sm:gap-4 text-[11px] text-text-muted">
                  <span>Profile: {c.profile_strength}%</span>
                  <span>Rank: {c.rank_score}</span>
                  <span>Skills: {c.skill_overlap.length}/{c.skill_overlap.length + c.missing_skills.length}</span>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 flex gap-2">
                  {sentPushes.has(c.user_id) ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" /> Notified
                    </span>
                  ) : (
                    <button
                      onClick={() => sendPush(c.user_id)}
                      disabled={pushLoading === c.user_id}
                      className="flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 active:bg-primary/10 disabled:opacity-50 min-h-[44px] sm:min-h-0"
                    >
                      {pushLoading === c.user_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Reach Out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {candidates.length === 0 && !loading && selectedJob && searchTime !== null && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 sm:p-8 text-center">
          <Users className="mx-auto mb-2 h-10 w-10 text-text-muted" />
          <p className="font-medium text-text">No matching candidates found</p>
          <p className="text-sm text-text-muted">Try a different job or adjust required skills.</p>
        </div>
      )}

      {/* How It Works */}
      <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5">
        <h3 className="mb-2 font-medium text-text">How Instant Shortlist Works</h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-text">5-Second Matching</p>
              <p className="text-xs text-text-muted">AI scans all candidates by skill graph instantly</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-text">Smart Ranking</p>
              <p className="text-xs text-text-muted">Skills 50% + Profile 20% + Activity 20% + Boost 10%</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Send className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium text-text">One-Click Outreach</p>
              <p className="text-xs text-text-muted">Message all candidates or reach out individually</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
