"use client";

import { useState } from "react";

interface CoverLetterResultProps {
  text: string;
}

export function CoverLetterResult({ text }: CoverLetterResultProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-gray-300 bg-card px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          type="button"
          onClick={download}
          className="rounded-lg border border-gray-300 bg-card px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
        >
          Download
        </button>
      </div>
      <div className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-card p-6 text-sm text-text">
        {text}
      </div>
    </div>
  );
}
