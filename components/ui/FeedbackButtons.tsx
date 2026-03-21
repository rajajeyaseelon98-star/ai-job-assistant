"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface FeedbackButtonsProps {
  feature: string;
  resultId?: string;
}

export function FeedbackButtons({ feature, resultId }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleFeedback(type: "up" | "down") {
    setFeedback(type);
    setSubmitted(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, resultId, type }),
      });
    } catch {
      // Non-blocking — feedback is best-effort
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <span>{feedback === "up" ? "Thanks for the feedback!" : "We'll improve this. Thanks!"}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-text-muted">Was this helpful?</span>
      <button
        onClick={() => handleFeedback("up")}
        className="rounded-lg p-1.5 text-text-muted hover:bg-green-50 hover:text-green-600 transition-colors"
        aria-label="Helpful"
      >
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleFeedback("down")}
        className="rounded-lg p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
        aria-label="Not helpful"
      >
        <ThumbsDown className="h-4 w-4" />
      </button>
    </div>
  );
}
