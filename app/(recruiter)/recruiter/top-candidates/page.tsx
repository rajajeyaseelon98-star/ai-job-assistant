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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Crown className="h-6 w-6 text-yellow-500" />
          Top Candidates
        </h1>
        <p className="text-sm text-text-muted">
          Discover highest-ranked candidates based on skills, experience, and profile quality
        </p>
      </div>

      {/* Skill Filter */}
      <form onSubmit={handleFilterSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="Filter by skills (e.g. React, Python, AWS)"
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Filter
        </button>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-card p-8 text-center">
          <Crown className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <h3 className="font-medium text-text">No candidates found</h3>
          <p className="mt-1 text-sm text-text-muted">
            {skillFilter
              ? "No candidates match these skills. Try broader terms."
              : "Top candidates will appear as users create profiles and improve their resumes."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate, index) => (
            <div
              key={candidate.user_id}
              className={`rounded-xl border bg-card p-4 transition-shadow hover:shadow-md ${
                candidate.is_boosted ? "border-yellow-300 bg-yellow-50/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Rank */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text">{candidate.name}</h3>
                    {candidate.is_boosted && (
                      <span className="flex items-center gap-0.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                        <Zap className="h-3 w-3" /> Boosted
                      </span>
                    )}
                  </div>
                  {candidate.headline && (
                    <p className="text-sm text-text-muted">{candidate.headline}</p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1">
                    {candidate.top_skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scores & Actions */}
                <div className="shrink-0 text-right space-y-2">
                  <div className="flex items-center gap-2">
                    {candidate.ats_score && (
                      <div className="text-center">
                        <div className="text-xs text-text-muted">ATS</div>
                        <div className="font-bold text-text">{candidate.ats_score}%</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="text-xs text-text-muted">Rank</div>
                      <div className="flex items-center gap-0.5 font-bold text-primary">
                        <Star className="h-3 w-3" />
                        {candidate.rank_score.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <a
                      href={`/recruiter/candidates/${candidate.user_id}`}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs text-text-muted hover:bg-gray-50"
                    >
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => handlePush(candidate.user_id, candidate.name)}
                      disabled={pushing === candidate.user_id}
                      className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
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
