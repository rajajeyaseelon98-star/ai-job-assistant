"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { FeedbackButtons } from "@/components/ui/FeedbackButtons";
import { ShareScoreButton } from "@/components/ui/ShareScoreButton";
import type { ATSAnalysisResult } from "@/types/resume";

interface ResumeAnalysisResultProps {
  data: ATSAnalysisResult;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-gray-200 pt-4 sm:pt-5 md:pt-6 first:border-t-0 first:pt-0">
      <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
  return (
    <span className={`text-xs sm:text-sm font-semibold ${color}`}>
      {score >= 80 ? "Strong" : score >= 60 ? "Fair" : "Needs Work"}
    </span>
  );
}

export function ResumeAnalysisResult({ data }: ResumeAnalysisResultProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-card shadow-sm">
      {/* ATS Score -- hero block */}
      <div className="border-b border-gray-200 bg-gray-50/50 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-text-muted">
              ATS Score
            </p>
            <p className="mt-1 sm:mt-2 text-4xl sm:text-5xl md:text-6xl font-bold text-text leading-none">
              {data.atsScore}
              <span className="text-xl sm:text-2xl md:text-3xl font-normal text-text-muted">%</span>
            </p>
          </div>
          <ScoreBadge score={data.atsScore} />
        </div>
        <ProgressBar value={data.atsScore} className="mt-3 sm:mt-4 w-full max-w-xs" />
        <div className="mt-3 flex items-center gap-3">
          <ShareScoreButton score={data.atsScore} type="ats" />
        </div>
      </div>

      <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 space-y-4 sm:space-y-5 md:space-y-6">
        {data.missingSkills?.length > 0 && (
          <Section title="Missing Skills">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {data.missingSkills.map((s, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-red-700 ring-1 ring-inset ring-red-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {data.resumeImprovements?.length > 0 && (
          <Section title="Resume Improvements">
            <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-text">
              {data.resumeImprovements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 sm:gap-3">
                  <span className="mt-0.5 shrink-0 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {data.recommendedRoles?.length > 0 && (
          <Section title="Suggested Roles">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {data.recommendedRoles.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-text"
                >
                  <span className="shrink-0 text-primary">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </span>
                  <span className="line-clamp-2">{r}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Feedback */}
        <div className="border-t border-gray-200 pt-4">
          <FeedbackButtons feature="resume_analysis" />
        </div>
      </div>
    </div>
  );
}
