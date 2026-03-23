"use client";

import { FeedbackButtons } from "@/components/ui/FeedbackButtons";
import { ShareScoreButton } from "@/components/ui/ShareScoreButton";
import type { ATSAnalysisResult } from "@/types/resume";

interface ResumeAnalysisResultProps {
  data: ATSAnalysisResult;
}

export function ResumeAnalysisResult({ data }: ResumeAnalysisResultProps) {
  const scoreColor =
    data.atsScore >= 80
      ? "text-emerald-500"
      : data.atsScore >= 60
        ? "text-amber-500"
        : "text-rose-500";

  return (
    <div className="mx-auto mt-12 w-full max-w-3xl border-t border-slate-200 pt-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
        <div className="absolute right-4 top-4">
          <ShareScoreButton
            score={data.atsScore}
            type="ats"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-indigo-600"
          />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">ATS Score</p>
        <div className="mt-3 flex items-end justify-center gap-2">
          <p className={`font-display text-7xl font-bold tracking-tighter leading-none ${scoreColor}`}>
            {data.atsScore}
          </p>
          <p className="text-2xl font-medium text-slate-400">/ 100</p>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        {data.missingSkills?.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/30 p-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Missing Skills</h3>
            <div className="flex flex-wrap gap-2">
              {data.missingSkills.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 shadow-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {data.resumeImprovements?.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Top Improvements</h3>
            <ul>
              {data.resumeImprovements.map((s, i) => (
                <li key={i} className="mb-4 flex items-start gap-4 last:mb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-sm font-bold text-indigo-600">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-slate-700">{s}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {data.recommendedRoles?.length > 0 ? (
          <section className="mt-6">
            <h3 className="mb-4 font-display text-lg font-semibold text-slate-900">Recommended Roles</h3>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data.recommendedRoles.map((r, i) => (
                <div
                  key={i}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md"
                >
                  <span className="shrink-0 text-slate-400 group-hover:text-indigo-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </span>
                  <span className="line-clamp-2 text-sm text-slate-700">{r}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="border-t border-slate-200 pt-4">
          <FeedbackButtons feature="resume_analysis" />
        </div>
      </div>
    </div>
  );
}
