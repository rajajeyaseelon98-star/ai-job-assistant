"use client";

import Link from "next/link";
import { Wand2 } from "lucide-react";
import { FeedbackButtons } from "@/components/ui/FeedbackButtons";
import { ShareScoreButton } from "@/components/ui/ShareScoreButton";

interface MatchResultProps {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  resume_improvements: string[];
  /** Prefill Resume Tailoring from this match */
  tailorContext?: { jobTitle: string; jobDescription: string; resumeText: string };
}

export function MatchResult({
  match_score,
  matched_skills,
  missing_skills,
  resume_improvements,
  tailorContext,
}: MatchResultProps) {
  const scoreColor =
    match_score >= 80
      ? "text-emerald-500"
      : match_score >= 60
        ? "text-amber-500"
        : "text-rose-500";
  const progressFill =
    match_score >= 80
      ? "bg-emerald-500"
      : match_score >= 60
        ? "bg-amber-500"
        : "bg-rose-500";

  function goToTailor() {
    if (typeof window !== "undefined" && tailorContext) {
      try {
        sessionStorage.setItem("tailorFromJobMatch", JSON.stringify(tailorContext));
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="mt-12 space-y-4 border-t border-slate-200 pt-12 sm:space-y-5 md:space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
        <div className="absolute right-4 top-4">
          <ShareScoreButton
            score={match_score}
            type="match"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-indigo-600"
          />
        </div>
        <h3 className="font-display text-lg font-semibold text-slate-900">Gap analysis &amp; match score</h3>
        <p className="mt-1 text-xs text-slate-500">
          This page shows how you stack up — not a rewritten resume.
        </p>
        <div className="mt-3 flex items-end justify-center gap-2">
          <span className={`font-display text-7xl font-bold tracking-tighter leading-none ${scoreColor}`}>{match_score}</span>
          <span className="text-2xl font-medium text-slate-400">%</span>
        </div>
        <div className="mx-auto mt-6 h-2.5 max-w-md overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${progressFill}`}
            style={{ width: `${match_score}%` }}
          />
        </div>
      </div>
      {matched_skills?.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Matched skills</h3>
          <div className="flex flex-wrap gap-2">
            {matched_skills.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {missing_skills?.length > 0 && (
        <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/30 p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Missing skills</h3>
          <div className="flex flex-wrap gap-2">
            {missing_skills.map((s, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 shadow-sm"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {resume_improvements?.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Resume improvements</h3>
          <ul>
            {resume_improvements.map((s, i) => (
              <li key={i} className="mb-4 flex items-start gap-4 last:mb-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-sm font-bold text-indigo-600">
                  {i + 1}
                </span>
                <span className="pt-1 leading-relaxed text-slate-700">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tailorContext && (
        <div className="relative mt-10 overflow-hidden rounded-3xl bg-indigo-900 p-8 text-center shadow-xl sm:p-10">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl"
            aria-hidden
          />
          <p className="relative mb-2 font-display text-2xl font-bold text-white">Want a rewritten resume?</p>
          <p className="relative mb-8 text-sm text-indigo-200 sm:text-base">
            Resume Tailoring uses AI to reshape your resume for this role (ATS-friendly).
          </p>
          <Link
            href="/tailor-resume"
            onClick={goToTailor}
            className="relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-indigo-900 shadow-lg transition-all hover:bg-slate-50 sm:w-auto"
          >
            <Wand2 className="h-4 w-4" />
            Fix this with AI — Tailor resume
          </Link>
        </div>
      )}

      {/* Feedback */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
        <FeedbackButtons feature="job_match" />
      </div>
    </div>
  );
}
