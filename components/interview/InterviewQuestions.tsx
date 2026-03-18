"use client";

import { useState } from "react";
import type { InterviewPrepResponse } from "@/types/analysis";

interface InterviewQuestionsProps {
  data: InterviewPrepResponse;
}

function QuestionItem({ q, index }: { q: { question: string; answer: string }; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="space-y-1.5 sm:space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full min-h-[44px] flex items-start gap-2 sm:gap-3 text-left active:bg-gray-50 rounded-lg -mx-2 px-2 py-1 transition-colors"
      >
        <span className="mt-0.5 shrink-0 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold">
          {index + 1}
        </span>
        <span className="flex-1 text-sm sm:text-base font-medium text-text leading-snug">{q.question}</span>
        <svg
          className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="ml-7 sm:ml-9 pb-1">
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">{q.answer}</p>
        </div>
      )}
    </li>
  );
}

function QuestionList({
  title,
  items,
  icon,
}: {
  title: string;
  items: { question: string; answer: string }[];
  icon: React.ReactNode;
}) {
  if (!items?.length) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-card shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50/50 px-4 py-3 sm:px-5 sm:py-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="shrink-0 text-primary">{icon}</span>
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-text">{title}</h3>
          <span className="ml-auto text-xs sm:text-sm text-text-muted">{items.length} questions</span>
        </div>
      </div>
      <div className="px-4 py-3 sm:px-5 sm:py-4 md:px-6 md:py-5">
        <ol className="space-y-2 sm:space-y-3">
          {items.map((q, i) => (
            <QuestionItem key={i} q={q} index={i} />
          ))}
        </ol>
      </div>
    </div>
  );
}

export function InterviewQuestions({ data }: InterviewQuestionsProps) {
  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <QuestionList
        title="Technical Questions"
        items={data.technical_questions ?? []}
        icon={
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
        }
      />
      <QuestionList
        title="Behavioral Questions"
        items={data.behavioral_questions ?? []}
        icon={
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        }
      />
      <QuestionList
        title="Coding Questions"
        items={data.coding_questions ?? []}
        icon={
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
        }
      />
    </div>
  );
}
