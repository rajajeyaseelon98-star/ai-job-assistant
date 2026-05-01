"use client";

import { useState } from "react";
import type { InterviewPrepResponse } from "@/types/analysis";

interface InterviewQuestionsProps {
  data: InterviewPrepResponse;
}

function QuestionItem({ q, index }: { q: { question: string; answer: string }; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="mb-3 overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="group flex w-full items-start gap-4 p-5 text-left"
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-bold text-text-muted">
          {index + 1}
        </span>
        <span className="pr-8 font-medium leading-relaxed text-text">{q.question}</span>
        <svg
          className={`mt-0.5 h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:text-primary ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {expanded && (
        <div className="px-[3.75rem] pb-5 pr-5 pl-[3.75rem]">
          <div className="rounded-lg border-t border-border bg-surface-muted/60 p-4 text-sm leading-loose text-text-muted whitespace-pre-wrap">
            {q.answer}
          </div>
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
    <div className="mb-12">
      <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2.5">
          <span className="h-5 w-5 text-primary">{icon}</span>
          <h3 className="font-display text-xl font-bold text-text">{title}</h3>
        </div>
        <span className="rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-text-muted">
          {items.length} questions
        </span>
      </div>
      <ol>
        {items.map((q, i) => (
          <QuestionItem key={i} q={q} index={i} />
        ))}
      </ol>
    </div>
  );
}

export function InterviewQuestions({ data }: InterviewQuestionsProps) {
  const technicalQuestions = data.technical_questions ?? [];
  const behavioralQuestions = data.behavioral_questions ?? [];
  const codingQuestions = data.coding_questions ?? [];

  const hasAnyQuestions =
    technicalQuestions.length > 0 ||
    behavioralQuestions.length > 0 ||
    codingQuestions.length > 0;

  if (!hasAnyQuestions) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <svg
          className="mx-auto h-10 w-10 text-text-muted/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l4 2"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <p className="mt-4 text-text-muted">
          No interview questions yet. Generate them using the form above.
        </p>
      </div>
    );
  }

  return (
    <div>
      <QuestionList
        title="Technical Questions"
        items={technicalQuestions}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
        }
      />
      <QuestionList
        title="Behavioral Questions"
        items={behavioralQuestions}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        }
      />
      <QuestionList
        title="Coding Questions"
        items={codingQuestions}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
          </svg>
        }
      />
    </div>
  );
}
