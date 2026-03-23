"use client";

import { useState, useRef } from "react";
import { FeedbackButtons } from "@/components/ui/FeedbackButtons";

interface CoverLetterResultProps {
  id: string | null;
  text: string;
  onSaved?: (newContent: string) => void;
}

export function CoverLetterResult({ id, text, onSaved }: CoverLetterResultProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(text);
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const displayText = editing ? content : text;

  async function copy() {
    await navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadTxt() {
    const blob = new Blob([displayText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cover-letter.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Cover Letter</title>
      <style>body{font-family:Georgia,serif;max-width:700px;margin:2rem auto;padding:1rem;line-height:1.6;white-space:pre-wrap;}</style>
      </head><body>${displayText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  async function saveEdit() {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/cover-letters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditing(false);
      onSaved?.(content);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 className="font-display text-2xl font-bold text-slate-900 mb-6">Your Cover Letter</h3>
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/60 inline-flex">
        <button
          type="button"
          onClick={copy}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          type="button"
          onClick={downloadTxt}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2"
        >
          Download TXT
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2"
        >
          Download PDF
        </button>
        {id && (
          editing ? (
            <>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setContent(text); }}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { setEditing(true); setContent(displayText); }}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 shadow-sm rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2"
            >
              Edit
            </button>
          )
        )}
      </div>
      <div ref={printRef} className="bg-white border border-slate-200 shadow-md rounded-2xl p-8 sm:p-12 prose prose-slate max-w-none text-slate-700 leading-loose">
        {editing ? (
          <textarea
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 sm:px-5 sm:py-5 text-sm sm:text-base leading-loose text-slate-700 min-h-[300px] sm:min-h-[400px] resize-y transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        ) : (
          <div className="whitespace-pre-wrap overflow-x-auto">
            {displayText}
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="mt-3">
        <FeedbackButtons feature="cover_letter" resultId={id || undefined} />
      </div>
    </div>
  );
}
