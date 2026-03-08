"use client";

import { useRef, useState } from "react";
import type { ImprovedResumeContent } from "@/types/analysis";

interface ImprovedResumeViewProps {
  content: ImprovedResumeContent;
  improvedResumeId?: string;
}

export function improvedToPlainText(c: ImprovedResumeContent): string {
  const lines: string[] = [];
  lines.push("PROFESSIONAL SUMMARY");
  lines.push("--------------------");
  lines.push(c.summary || "");
  lines.push("");
  lines.push("SKILLS");
  lines.push("------");
  lines.push(c.skills?.join(" · ") || "");
  lines.push("");
  if (c.experience?.length) {
    lines.push("EXPERIENCE");
    lines.push("----------");
    for (const exp of c.experience) {
      lines.push(`${exp.title} at ${exp.company}`);
      (exp.bullets || []).forEach((b) => lines.push(`  • ${b}`));
      lines.push("");
    }
  }
  if (c.projects?.length) {
    lines.push("PROJECTS");
    lines.push("--------");
    for (const proj of c.projects) {
      lines.push(`${proj.name}: ${proj.description || ""}`);
      (proj.bullets || []).forEach((b) => lines.push(`  • ${b}`));
      lines.push("");
    }
  }
  lines.push("EDUCATION");
  lines.push("----------");
  lines.push(c.education || "");
  return lines.join("\n");
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function improvedToHtml(c: ImprovedResumeContent): string {
  const sections: string[] = [];
  sections.push("<h2>Professional Summary</h2><p>" + esc(c.summary || "").replace(/\n/g, "<br>") + "</p>");
  sections.push("<h2>Skills</h2><p>" + esc(c.skills?.join(", ") || "") + "</p>");
  if (c.experience?.length) {
    let html = "<h2>Experience</h2>";
    for (const exp of c.experience) {
      html += `<h3>${esc(exp.title)} — ${esc(exp.company)}</h3><ul>`;
      (exp.bullets || []).forEach((b) => (html += `<li>${esc(b)}</li>`));
      html += "</ul>";
    }
    sections.push(html);
  }
  if (c.projects?.length) {
    let html = "<h2>Projects</h2>";
    for (const proj of c.projects) {
      html += `<h3>${esc(proj.name)}</h3><p>${esc(proj.description || "")}</p>`;
      if (proj.bullets?.length) {
        html += "<ul>";
        proj.bullets.forEach((b) => (html += `<li>${esc(b)}</li>`));
        html += "</ul>";
      }
    }
    sections.push(html);
  }
  sections.push("<h2>Education</h2><p>" + esc(c.education || "").replace(/\n/g, "<br>") + "</p>");
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Improved Resume</title>
  <style>
    body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; line-height: 1.5; color: #111; }
    h2 { font-size: 1.1em; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 24px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
    h3 { font-size: 1em; margin: 12px 0 4px; }
    ul { margin: 0 0 16px; padding-left: 20px; }
    li { margin: 4px 0; }
    p { margin: 0 0 12px; }
  </style>
</head>
<body>
  ${sections.join("\n  ")}
</body>
</html>`;
}

export function ImprovedResumeView({ content, improvedResumeId }: ImprovedResumeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copyFeedback, setCopyFeedback] = useState<"copied" | "error" | null>(null);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);

  function handleCopy() {
    setCopyFeedback(null);
    const text = improvedToPlainText(content);
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyFeedback("copied");
        setTimeout(() => setCopyFeedback(null), 2000);
      })
      .catch(() => {
        setCopyFeedback("error");
        setTimeout(() => setCopyFeedback(null), 3000);
      });
  }

  function handleDownloadPdf() {
    setPdfMessage(null);
    const html = improvedToHtml(content);
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Print improved resume");
    iframe.style.position = "fixed";
    iframe.style.inset = "0";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.zIndex = "9999";
    iframe.style.backgroundColor = "#fff";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      setPdfMessage("Could not open print dialog.");
      setTimeout(() => setPdfMessage(null), 4000);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow?.focus();
    const removeIframe = () => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    };
    iframe.contentWindow?.addEventListener("afterprint", removeIframe);
    setTimeout(() => {
      iframe.contentWindow?.print();
    }, 300);
  }

  async function handleDownloadDocx() {
    setDocxError(null);
    if (improvedResumeId) {
      window.open(`/api/improved-resumes/${improvedResumeId}/download?format=docx`, "_blank");
      return;
    }
    setDocxLoading(true);
    try {
      const res = await fetch("/api/improved-resumes/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "improved-resume.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDocxError(e instanceof Error ? e.message : "Download failed");
      setTimeout(() => setDocxError(null), 4000);
    } finally {
      setDocxLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
        >
          {copyFeedback === "copied" ? "Copied!" : "Copy text"}
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
        >
          Download PDF
        </button>
        <button
          type="button"
          onClick={handleDownloadDocx}
          disabled={docxLoading}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50 disabled:opacity-50"
        >
          {docxLoading ? "Preparing…" : "Download DOCX"}
        </button>
        {copyFeedback === "error" && (
          <span className="text-sm text-amber-600">Copy failed. Try selecting text and copying manually.</span>
        )}
        {pdfMessage && <span className="text-sm text-amber-600">{pdfMessage}</span>}
        {docxError && <span className="text-sm text-red-600">{docxError}</span>}
      </div>

      <div ref={containerRef} className="overflow-hidden rounded-xl border border-gray-200 bg-card shadow-sm print:border-0 print:shadow-none">
        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Improved resume</h3>
        </div>
        <div className="px-6 py-6 space-y-6">
          {content.summary && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Professional summary</h4>
              <p className="text-sm text-text whitespace-pre-wrap">{content.summary}</p>
            </section>
          )}
          {content.skills?.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Skills</h4>
              <p className="text-sm text-text">{content.skills.join(" · ")}</p>
            </section>
          )}
          {content.experience?.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Experience</h4>
              <ul className="space-y-4">
                {content.experience.map((exp, i) => (
                  <li key={i}>
                    <p className="font-medium text-text">{exp.title} — {exp.company}</p>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-text">
                      {(exp.bullets || []).map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {content.projects?.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Projects</h4>
              <ul className="space-y-4">
                {content.projects.map((proj, i) => (
                  <li key={i}>
                    <p className="font-medium text-text">{proj.name}</p>
                    {proj.description && <p className="text-sm text-text-muted">{proj.description}</p>}
                    {(proj.bullets || []).length > 0 && (
                      <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-text">
                        {(proj.bullets || []).map((b, j) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {content.education && (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Education</h4>
              <p className="text-sm text-text">{content.education}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
