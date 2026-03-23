"use client";

import { useState, useEffect } from "react";
import {
  Crown,
  Star,
  Zap,
  Search,
  Loader2,
  Send,
  ArrowUpRight,
} from "lucide-react";

interface CandidateRanking {
  user_id: string;
  name: string;
  headline: string | null;
  rank_score: number;
  is_boosted: boolean;
  top_skills: string[];
  ats_score: number | null;
}

export default function TopCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState("");
  const [pushing, setPushing] = useState<string | null>(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  async function fetchCandidates() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (skillFilter) params.set("skills", skillFilter);
      const res = await fetch(`/api/recruiter/top-candidates?${params}`);
      if (res.ok) setCandidates(await res.json());
    } catch {
      // Ignore
    }
    setLoading(false);
  }

  async function handlePush(candidateId: string, name: string) {
    setPushing(candidateId);
    try {
      await fetch("/api/recruiter/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          push_type: "job_invite",
          title: "A recruiter is interested in your profile!",
          message: `Your profile caught our attention. We'd love to discuss potential opportunities with you.`,
        }),
      });
      alert(`Notification sent to ${name}!`);
    } catch {
      alert("Failed to send notification");
    }
    setPushing(null);
  }

  function handleFilterSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchCandidates();
  }

  return (
    <div className="max-w-5xl mx-auto w-full py-12 px-6 space-y-8">
      <div>
        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <Crown className="h-5 w-5" />
        </div>
        <h1 className="font-display text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Top Candidates</h1>
        <p className="text-slate-500 text-lg mb-10 max-w-2xl">
          Discover highest-ranked candidates based on skills, experience, and profile quality
        </p>
      </div>

      {/* Skill Filter */}
      <form onSubmit={handleFilterSearch} className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 rounded-[32px] p-4 mb-12 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="Filter by skills (e.g. React, Python, AWS)"
            className="flex-1 bg-slate-50 border border-transparent rounded-2xl px-6 py-4 pl-11 focus:bg-white focus:border-indigo-500/20 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-900 font-medium w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 rounded-xl px-8 py-4 font-bold transition-all flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          Filter
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[40px] py-32 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-white text-slate-100 rounded-[32px] flex items-center justify-center mb-8 shadow-sm relative">
            <Crown className="text-slate-300 w-10 h-10" />
          </div>
          <h3 className="font-display text-2xl font-bold text-slate-900 mb-3">Elite Talent Queue Is Empty</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
            {skillFilter
              ? "No candidates match these skills. Try broader terms."
              : "Top candidates will appear as users create profiles and improve their resumes."}
          </p>
          <div className="mt-10 px-4 py-2 bg-indigo-50 rounded-full inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">AI Ranking in Progress</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate, index) => (
            <div
              key={candidate.user_id}
              className={`bg-white border border-slate-200 rounded-2xl p-6 mb-4 flex items-center justify-between hover:border-indigo-300 hover:shadow-lg transition-all ${
                candidate.is_boosted ? "border-amber-300 bg-amber-50/30" : "border-slate-200"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                {/* Rank */}
                <div className="flex items-center gap-3 sm:block">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-lg font-bold text-indigo-600">
                    {index + 1}
                  </div>
                  {/* Mobile-only: Name inline with rank */}
                  <div className="sm:hidden min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">{candidate.name}</h3>
                      {candidate.is_boosted && (
                        <span className="flex items-center gap-0.5 shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          <Zap className="h-3 w-3" /> Boosted
                        </span>
                      )}
                    </div>
                    {candidate.headline && (
                      <p className="text-sm text-slate-500 truncate">{candidate.headline}</p>
                    )}
                  </div>
                </div>

                {/* Info - desktop */}
                <div className="hidden sm:block flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{candidate.name}</h3>
                    {candidate.is_boosted && (
                      <span className="flex items-center gap-0.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                        <Zap className="h-3 w-3" /> Boosted
                      </span>
                    )}
                  </div>
                  {candidate.headline && (
                    <p className="text-sm text-slate-500">{candidate.headline}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {candidate.top_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skills - mobile */}
                <div className="sm:hidden flex flex-wrap gap-1">
                  {candidate.top_skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Scores & Actions */}
                <div className="flex items-center justify-between sm:flex-col sm:items-end sm:shrink-0 sm:text-right gap-2 sm:gap-2">
                  <div className="flex items-center gap-3 sm:gap-2">
                    {candidate.ats_score && (
                      <div className="text-center">
                        <div className="text-xs text-slate-500">ATS</div>
                        <div className="font-bold text-slate-900">{candidate.ats_score}%</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-xs text-slate-500">Rank</div>
                      <div className="flex items-center gap-0.5 font-bold text-indigo-600">
                        <Star className="h-3 w-3" />
                        {candidate.rank_score.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <a
                      href={`/recruiter/candidates/${candidate.user_id}`}
                      className="rounded-xl border border-slate-200 p-2 sm:px-2 sm:py-1 text-xs text-slate-500 hover:bg-slate-50 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center"
                    >
                      <ArrowUpRight className="h-4 w-4 sm:h-3 sm:w-3" />
                    </a>
                    <button
                      onClick={() => handlePush(candidate.user_id, candidate.name)}
                      disabled={pushing === candidate.user_id}
                      className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-2 sm:py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 min-h-[44px] sm:min-h-0"
                    >
                      <Send className="h-3 w-3" />
                      {pushing === candidate.user_id ? "..." : "Reach Out"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
