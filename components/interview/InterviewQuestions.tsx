"use client";

import type { InterviewPrepResponse } from "@/types/analysis";

interface InterviewQuestionsProps {
  data: InterviewPrepResponse;
}

function QuestionList({
  title,
  items,
}: {
  title: string;
  items: { question: string; answer: string }[];
}) {
  if (!items?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-text">{title}</h3>
      <ol className="list-decimal space-y-4 pl-5">
        {items.map((q, i) => (
          <li key={i} className="space-y-1">
            <p className="font-medium text-text">{q.question}</p>
            <p className="text-sm text-text-muted">{q.answer}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function InterviewQuestions({ data }: InterviewQuestionsProps) {
  return (
    <div className="space-y-8">
      <QuestionList title="Technical questions" items={data.technical_questions ?? []} />
      <QuestionList title="Behavioral questions" items={data.behavioral_questions ?? []} />
      <QuestionList title="Coding questions" items={data.coding_questions ?? []} />
    </div>
  );
}
