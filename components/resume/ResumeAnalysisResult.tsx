"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
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
    <section className="border-t border-gray-200 pt-6 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function ResumeAnalysisResult({ data }: ResumeAnalysisResultProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-card shadow-sm">
      {/* ATS Score — hero block */}
      <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          ATS Score
        </p>
        <p className="mt-2 text-4xl font-bold text-text">
          {data.atsScore}
          <span className="text-2xl font-normal text-text-muted">%</span>
        </p>
        <ProgressBar value={data.atsScore} className="mt-4 max-w-xs" />
      </div>

      <div className="px-6 py-6 space-y-6">
        {data.missingSkills?.length > 0 && (
          <Section title="Missing Skills">
            <ul className="space-y-2 text-sm text-text">
              {data.missingSkills.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {data.resumeImprovements?.length > 0 && (
          <Section title="Resume Improvements">
            <ul className="space-y-2 text-sm text-text">
              {data.resumeImprovements.map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {data.recommendedRoles?.length > 0 && (
          <Section title="Suggested Roles">
            <ul className="space-y-2 text-sm text-text">
              {data.recommendedRoles.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}
