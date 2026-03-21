"use client";

import { useState } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";

interface ShareScoreButtonProps {
  score: number;
  type: "ats" | "match" | "interview";
  label?: string;
}

export function ShareScoreButton({ score, type, label }: ShareScoreButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const messages: Record<string, string> = {
    ats: `I scored ${score}% on my ATS resume check! Try it free at AI Job Assistant.`,
    match: `I got a ${score}% job match score! Find your match at AI Job Assistant.`,
    interview: `My interview probability is ${score}%! Check yours at AI Job Assistant.`,
  };

  const text = messages[type] || messages.ats;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(text + "\n" + window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
    setShowOptions(false);
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "My AI Job Assistant Score",
          text,
          url: window.location.origin,
        });
      } catch {
        // User cancelled
      }
    } else {
      copyLink();
    }
    setShowOptions(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
            nativeShare();
          } else {
            setShowOptions(!showOptions);
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-gray-50 hover:text-text transition-colors"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-500" />
            <span className="text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Share2 className="h-3.5 w-3.5" />
            <span>{label || "Share Score"}</span>
          </>
        )}
      </button>

      {showOptions && (
        <div className="absolute right-0 top-full mt-1 z-10 rounded-lg border border-gray-200 bg-card shadow-lg py-1 min-w-[160px]">
          <button
            onClick={copyLink}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-gray-50"
          >
            <LinkIcon className="h-4 w-4" />
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}
