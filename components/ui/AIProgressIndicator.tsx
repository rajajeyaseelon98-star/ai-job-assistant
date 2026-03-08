"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "Analyzing your content…",
  "AI is processing…",
  "Almost there…",
  "Wrapping up…",
];

interface AIProgressIndicatorProps {
  /** Override the rotating status messages */
  message?: string;
}

export function AIProgressIndicator({ message }: AIProgressIndicatorProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <svg
        className="h-5 w-5 animate-spin text-primary"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-sm font-medium text-primary">
        {message || MESSAGES[msgIndex]}
      </span>
    </div>
  );
}
