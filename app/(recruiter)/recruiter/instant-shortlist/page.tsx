"use client";

import { useState } from "react";
import Link from "next/link";
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
import { useRecruiterJobs, useInstantShortlist, usePushCandidate } from "@/hooks/queries/use-recruiter";

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
  const { data: jobsRaw, isLoading: jobsLoading } = useRecruiterJobs();
  const jobs = ((jobsRaw ?? []) as JobPosting[]).filter((j) => j.skills_required?.length);
  const shortlistMutation = useInstantShortlist();
  const pushMutation = usePushCandidate();
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [candidates, setCandidates] = useState<ShortlistCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState<number | null>(null);
  const [totalSearched, setTotalSearched] = useState(0);
  const [sentPushes, setSentPushes] = useState<Set<string>>(new Set());
  const [pushLoading, setPushLoading] = useState<string | null>(null);

  async function findCandidates() {
    const job = jobs.find((j) => j.id === selectedJob);
    if (!job || !job.skills_required?.length) return;

    setLoading(true);
    setCandidates([]);
    try {
      const data = await shortlistMutation.mutateAsync({
        job_title: job.title,
        skills_required: job.skills_required,
        experience_min: job.experience_min,
        experience_max: job.experience_max,
        location: job.location,
        limit: 10,
      }) as Record<string, unknown>;
      setCandidates((data.candidates as ShortlistCandidate[]) || []);
      setSearchTime((data.search_time_ms as number) || 0);
      setTotalSearched((data.total_searched as number) || 0);
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
      await pushMutation.mutateAsync({
        candidate_id: candidateId,
        push_type: "shortlisted",
        title: `Shortlisted for ${job.title}`,
        message: `You've been shortlisted for ${job.title}! We'd love to connect with you.`,
        job_id: job.id,
      });
      setSentPushes((prev) => new Set([...prev, candidateId]));
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
    <div className="max-w-4xl mx-auto w-full py-12 px-6 space-y-10">
      <div>
        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <Zap className="h-5 w-5" />
        </div>
        <h1 className="font-display text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Instant Shortlist</h1>
        <p className="text-slate-500 text-lg mb-10">
          Top candidates matched in seconds -- not hours
        </p>
      </div>

      {/* Job Selector */}
      <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[32px] p-8 sm:p-12 mb-10 text-center">
        {jobsLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
        ) : jobs.length === 0 ? (
          <>
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search className="h-8 w-8" />
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Select a Job Posting</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-8">No job postings with required skills are available yet. Post a role to start AI sourcing.</p>
            <Link
              href="/recruiter/jobs/new"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-8 py-4 font-bold transition-all inline-flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Post a Job
            </Link>
          </>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-3 text-left">
            <h2 className="sr-only">Select a Job Posting</h2>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 transition-all focus:bg-white focus:border-indigo-500 outline-none text-slate-800"
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
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-8 py-3.5 font-medium disabled:opacity-50 w-full sm:w-auto"
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg">
                🔥
              </div>
              <div>
                <p className="font-bold text-emerald-800">
                  {candidates.length} Perfect Candidates Found
                </p>
                <p className="text-xs text-emerald-600">
                  Searched {totalSearched} candidates in {searchTime}ms
                </p>
              </div>
            </div>
            <button
              onClick={messageAll}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 min-h-[44px] w-full sm:w-auto"
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
                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                  c.is_boosted ? "border-amber-300 bg-amber-50/30" : "border-slate-200"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600">
                      #{i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{c.name}</span>
                        {c.is_boosted && (
                          <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                            <Star className="h-3 w-3" /> Boosted
                          </span>
                        )}
                      </div>
                      {c.headline && <p className="text-sm text-slate-500 truncate">{c.headline}</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 self-end sm:self-start">
                    <div className="text-xl font-bold text-indigo-600 sm:text-2xl">{c.match_score}%</div>
                    <div className="text-[10px] text-slate-500">match</div>
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
                <div className="mt-3 flex flex-wrap gap-3 sm:gap-4 text-[11px] text-slate-500">
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
                      className="flex items-center gap-1 rounded-xl border border-indigo-200 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 min-h-[44px] sm:min-h-0"
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
        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center">
          <Users className="mx-auto mb-2 h-10 w-10 text-slate-400" />
          <p className="font-medium text-slate-900">No matching candidates found</p>
          <p className="text-sm text-slate-500">Try a different job or adjust required skills.</p>
        </div>
      )}

      {/* How It Works */}
      <div>
        <h3 className="font-display text-lg font-bold text-slate-800 mb-8 flex items-center gap-3">
          How Instant Shortlist Works
          <span className="h-px w-10 bg-indigo-300" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-slate-50/50 border border-slate-200/60 rounded-[32px]">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 mb-6 transition-transform hover:scale-110">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold text-slate-900 text-sm mb-2 block">5-Second Matching</span>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">AI scans all candidates by skill graph instantly</p>
            </div>
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 mb-6 transition-transform hover:scale-110">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold text-slate-900 text-sm mb-2 block">Smart Ranking</span>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Skills 50% + Profile 20% + Activity 20% + Boost 10%</p>
            </div>
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 mb-6 transition-transform hover:scale-110">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold text-slate-900 text-sm mb-2 block">One-Click Outreach</span>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Message all candidates or reach out individually</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
          Indexing
        </span>
        <span className="text-slate-400 text-[11px] mt-2 block">AI is currently indexing candidate database...</span>
      </div>
    </div>
  );
}
