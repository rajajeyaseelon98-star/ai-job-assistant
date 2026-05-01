"use client";

import { useState, useRef } from "react";
import { FeedbackButtons } from "@/components/ui/FeedbackButtons";
import { usePatchCoverLetter } from "@/hooks/mutations/use-cover-letter-crud";
import { formatApiFetchThrownError } from "@/lib/api-error";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

interface CoverLetterResultProps {
  id: string | null;
  text: string;
  onSaved?: (newContent: string) => void;
}

export function CoverLetterResult({ id, text, onSaved }: CoverLetterResultProps) {
  const patchMut = usePatchCoverLetter();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(text);
  const [saveError, setSaveError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);
  const saving = patchMut.isPending;

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
    setSaveError("");
    try {
      await patchMut.mutateAsync({ id, content });
      setEditing(false);
      onSaved?.(content);
    } catch (e) {
      setSaveError(formatApiFetchThrownError(e) || "Failed to save");
    }
  }

  return (
    <div>
      <h3 className="mb-6 font-display text-2xl font-bold text-text">Your Cover Letter</h3>
      {saveError ? (
        <p className="mb-3 text-sm text-red-600">{saveError}</p>
      ) : null}
      <div className="mb-6 inline-flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-muted/60 p-1.5">
        <Button type="button" variant="secondary" onClick={copy} className="shadow-sm">
          {copied ? "Copied!" : "Copy"}
        </Button>
        <Button type="button" variant="secondary" onClick={downloadTxt} className="shadow-sm">
          Download TXT
        </Button>
        <Button type="button" variant="secondary" onClick={downloadPdf} className="shadow-sm">
          Download PDF
        </Button>
        {id && (
          editing ? (
            <>
              <Button type="button" onClick={saveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setContent(text);
                  setSaveError("");
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button type="button" variant="secondary" onClick={() => { setEditing(true); setContent(displayText); }}>
              Edit
            </Button>
          )
        )}
      </div>
      <div
        ref={printRef}
        className="prose prose-slate max-w-none rounded-2xl border border-border bg-card p-6 text-text shadow-md sm:p-8 md:p-12"
      >
        {editing ? (
          <Textarea
            className="min-h-[300px] resize-y rounded-xl text-sm leading-loose sm:min-h-[400px] sm:text-base"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        ) : (
          <div className="whitespace-pre-wrap break-words">
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
