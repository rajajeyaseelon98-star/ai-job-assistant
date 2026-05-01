"use client";

import { useRef, useState, useMemo } from "react";
import type { ImprovedResumeContent } from "@/types/analysis";
import { normalizeImprovedResumeContent } from "@/lib/normalizeImprovedResume";
import { apiFetchBlob } from "@/lib/api-fetcher";
import { Button } from "@/components/ui/Button";

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
  const normalized = useMemo(() => normalizeImprovedResumeContent(content), [content]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [copyFeedback, setCopyFeedback] = useState<"copied" | "error" | null>(null);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);

  function handleCopy() {
    setCopyFeedback(null);
    const text = improvedToPlainText(normalized);
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
    const html = improvedToHtml(normalized);
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
      const blob = await apiFetchBlob("/api/improved-resumes/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: normalized }),
      });
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
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="mt-12 flex flex-wrap items-center justify-end gap-2 rounded-t-2xl border border-border bg-surface-muted p-3">
        <Button type="button" variant="secondary" onClick={handleCopy} className="shadow-sm">
          <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
          </svg>
          {copyFeedback === "copied" ? "Copied!" : "Copy text"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleDownloadPdf} className="shadow-sm">
          <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download PDF
        </Button>
        <Button type="button" variant="secondary" onClick={handleDownloadDocx} disabled={docxLoading} className="shadow-sm">
          <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          {docxLoading ? "Preparing..." : "Download DOCX"}
        </Button>
      </div>

      {/* Feedback messages */}
      {copyFeedback === "error" && (
        <p className="text-xs sm:text-sm text-amber-600 px-1">Copy failed. Try selecting text and copying manually.</p>
      )}
      {pdfMessage && <p className="text-xs sm:text-sm text-amber-600 px-1">{pdfMessage}</p>}
      {docxError && <p className="text-xs sm:text-sm text-red-600 px-1">{docxError}</p>}

      {/* Resume content */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-b-2xl border-x border-b border-border bg-card shadow-md print:border-0 print:shadow-none"
      >
        <div className="prose prose-slate prose-headings:font-display prose-headings:font-bold prose-headings:text-text prose-headings:tracking-tight prose-a:text-primary prose-a:font-medium prose-strong:text-text max-w-none space-y-5 p-8 sm:p-12">
          <section aria-labelledby="improved-summary">
            <h4 id="improved-summary" className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">
              Professional summary
            </h4>
            {normalized.summary.trim() ? (
              <p className="text-sm sm:text-base text-text whitespace-pre-wrap leading-relaxed">{normalized.summary}</p>
            ) : (
              <p className="text-sm text-text-muted italic">
                No summary yet — run the resume fixer again with your full resume text or job context for a stronger opening.
              </p>
            )}
          </section>

          <section aria-labelledby="improved-skills">
            <h4 id="improved-skills" className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:mb-3 sm:text-sm">
              Skills
            </h4>
            {normalized.skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {normalized.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="rounded-md border border-border bg-surface-muted px-2.5 py-1 text-sm text-text"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted italic">No skills listed — your source resume may be thin here; add skills and re-run.</p>
            )}
          </section>

          <section aria-labelledby="improved-exp">
            <h4 id="improved-exp" className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-text-muted">
              Experience
            </h4>
            {normalized.experience.length > 0 ? (
              <ul className="space-y-4 sm:space-y-5">
                {normalized.experience.map((exp, i) => (
                  <li key={i} className="border-l-2 border-primary/20 pl-3 sm:pl-4">
                    <p className="text-sm sm:text-base md:text-lg font-medium text-text leading-snug">{exp.title}</p>
                    <p className="text-xs sm:text-sm text-text-muted mt-0.5">{exp.company}</p>
                    <ul className="mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-text">
                      {(exp.bullets || []).map((b, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1 w-1 sm:h-1.5 sm:w-1.5 shrink-0 rounded-full bg-text-muted" />
                          <span className="leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted italic">No experience block parsed — paste detailed roles or upload a fuller resume.</p>
            )}
          </section>

          <section aria-labelledby="improved-proj">
            <h4 id="improved-proj" className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-text-muted">
              Projects
            </h4>
            {normalized.projects.length > 0 ? (
              <ul className="space-y-4 sm:space-y-5">
                {normalized.projects.map((proj, i) => (
                  <li key={i} className="border-l-2 border-primary/20 pl-3 sm:pl-4">
                    <p className="text-sm sm:text-base md:text-lg font-medium text-text leading-snug">{proj.name}</p>
                    {proj.description ? (
                      <p className="text-xs sm:text-sm text-text-muted mt-0.5 line-clamp-3 sm:line-clamp-none">{proj.description}</p>
                    ) : null}
                    {(proj.bullets || []).length > 0 && (
                      <ul className="mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-text">
                        {(proj.bullets || []).map((b, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1 w-1 sm:h-1.5 sm:w-1.5 shrink-0 rounded-full bg-text-muted" />
                            <span className="leading-relaxed">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted italic">No projects listed — optional; add portfolio work to your source and re-run if relevant.</p>
            )}
          </section>

          <section aria-labelledby="improved-edu">
            <h4 id="improved-edu" className="mb-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-text-muted">
              Education
            </h4>
            {normalized.education.trim() ? (
              <p className="text-sm sm:text-base text-text leading-relaxed">{normalized.education}</p>
            ) : (
              <p className="text-sm text-text-muted italic">No education line yet — add degrees or certifications to your resume and try again.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
