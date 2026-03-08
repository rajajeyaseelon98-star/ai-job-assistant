"use client";

import { useRef } from "react";
import type { ImprovedResumeContent } from "@/types/analysis";

interface ImprovedResumeViewProps {
  content: ImprovedResumeContent;
  onDownloadPdf?: () => void;
  onDownloadDocx?: () => void;
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

function improvedToHtml(c: ImprovedResumeContent): string {
  const sections: string[] = [];
  sections.push("<h2>Professional Summary</h2><p>" + (c.summary || "").replace(/\n/g, "<br>") + "</p>");
  sections.push("<h2>Skills</h2><p>" + (c.skills?.join(", ") || "") + "</p>");
  if (c.experience?.length) {
    let html = "<h2>Experience</h2>";
    for (const exp of c.experience) {
      html += `<h3>${exp.title} — ${exp.company}</h3><ul>`;
      (exp.bullets || []).forEach((b) => (html += `<li>${b}</li>`));
      html += "</ul>";
    }
    sections.push(html);
  }
  if (c.projects?.length) {
    let html = "<h2>Projects</h2>";
    for (const proj of c.projects) {
      html += `<h3>${proj.name}</h3><p>${proj.description || ""}</p>`;
      if (proj.bullets?.length) {
        html += "<ul>";
        proj.bullets.forEach((b) => (html += `<li>${b}</li>`));
        html += "</ul>";
      }
    }
    sections.push(html);
  }
  sections.push("<h2>Education</h2><p>" + (c.education || "").replace(/\n/g, "<br>") + "</p>");
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

export function ImprovedResumeView({ content }: ImprovedResumeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleCopy() {
    const text = improvedToPlainText(content);
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function handleDownloadPdf() {
    const html = improvedToHtml(content);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) {
      w.onload = () => {
        w.print();
        URL.revokeObjectURL(url);
      };
    } else {
      URL.revokeObjectURL(url);
    }
  }

  async function handleDownloadDocx() {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
    const children: (Paragraph | ReturnType<typeof Paragraph.create>)[] = [];
    children.push(new Paragraph({ text: "Professional Summary", heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: content.summary || "" })] }));
    children.push(new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: content.skills?.join(", ") || "" })] }));
    for (const exp of content.experience || []) {
      children.push(new Paragraph({ text: `${exp.title} — ${exp.company}`, heading: HeadingLevel.HEADING_2 }));
      for (const b of exp.bullets || []) {
        children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: b })] }));
      }
    }
    if (content.projects?.length) {
      children.push(new Paragraph({ text: "Projects", heading: HeadingLevel.HEADING_1 }));
      for (const proj of content.projects) {
        children.push(new Paragraph({ text: proj.name, heading: HeadingLevel.HEADING_2 }));
        if (proj.description) {
          children.push(new Paragraph({ children: [new TextRun({ text: proj.description })] }));
        }
        for (const b of proj.bullets || []) {
          children.push(new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: b })] }));
        }
      }
    }
    children.push(new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ children: [new TextRun({ text: content.education || "" })] }));
    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "improved-resume.docx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
        >
          Copy text
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
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
        >
          Download DOCX
        </button>
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
