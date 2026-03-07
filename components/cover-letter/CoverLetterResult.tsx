"use client";

import { useState, useRef } from "react";

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
          onClick={downloadTxt}
          className="rounded-lg border border-gray-300 bg-card px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
        >
          Download TXT
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          className="rounded-lg border border-gray-300 bg-card px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
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
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setContent(text); }}
                className="rounded-lg border border-gray-300 bg-card px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => { setEditing(true); setContent(displayText); }}
              className="rounded-lg border border-gray-300 bg-card px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              Edit
            </button>
          )
        )}
      </div>
      <div ref={printRef}>
        {editing ? (
          <textarea
            className="w-full rounded-xl border border-gray-200 bg-card p-6 text-sm text-text min-h-[300px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        ) : (
          <div className="whitespace-pre-wrap rounded-xl border border-gray-200 bg-card p-6 text-sm text-text">
            {displayText}
          </div>
        )}
      </div>
    </div>
  );
}
