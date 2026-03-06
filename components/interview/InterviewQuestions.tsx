"use client";

import type { InterviewPrepResponse } from "@/types/analysis";

interface InterviewQuestionsProps {
  data: InterviewPrepResponse;
}

export function InterviewQuestions({ data }: InterviewQuestionsProps) {
  return (
    <div className="space-y-8">
      {data.technical_questions?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-text">Technical questions</h3>
          <ol className="list-decimal space-y-4 pl-5">
            {data.technical_questions.map((q, i) => (
              <li key={i} className="space-y-1">
                <p className="font-medium text-text">{q.question}</p>
                <p className="text-sm text-text-muted">{q.answer}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
      {data.behavioral_questions?.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-text">Behavioral questions</h3>
          <ol className="list-decimal space-y-4 pl-5">
            {data.behavioral_questions.map((q, i) => (
              <li key={i} className="space-y-1">
                <p className="font-medium text-text">{q.question}</p>
                <p className="text-sm text-text-muted">{q.answer}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
