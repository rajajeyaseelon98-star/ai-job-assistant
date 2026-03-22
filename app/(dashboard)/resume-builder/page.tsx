"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Copy, FileText } from "lucide-react";

const STEPS = ["Contact", "Summary", "Experience", "Education"] as const;

export default function ResumeBuilderPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");

  function buildPlainText(): string {
    const lines: string[] = [];
    lines.push(fullName || "Your Name");
    if (email) lines.push(email);
    if (phone) lines.push(phone);
    if (location) lines.push(location);
    lines.push("");
    lines.push("PROFESSIONAL SUMMARY");
    lines.push(summary || "(Add your summary)");
    lines.push("");
    lines.push("EXPERIENCE");
    lines.push(experience || "(Add roles, companies, and bullet achievements)");
    lines.push("");
    lines.push("EDUCATION");
    lines.push(education || "(Degree, school, year)");
    return lines.join("\n");
  }

  function openInAnalyzer() {
    const text = buildPlainText();
    try {
      sessionStorage.setItem("resumeBuilderDraft", text);
    } catch {
      /* ignore */
    }
    router.push("/resume-analyzer");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-text flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Quick Resume Builder
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Step-by-step draft you can paste into the Resume Analyzer for an ATS score — no file required.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-muted">
        {STEPS.map((label, i) => (
          <span key={label} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            <span
              className={`rounded-full px-2 py-0.5 ${
                i === step ? "bg-primary text-white" : i < step ? "bg-green-100 text-green-800" : "bg-gray-100"
              }`}
            >
              {i + 1}. {label}
            </span>
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-card p-4 sm:p-6 shadow-sm space-y-4">
        {step === 0 && (
          <>
            <label className="block text-sm font-medium text-text">Full name</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
            <label className="block text-sm font-medium text-text">Email</label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="block text-sm font-medium text-text">Phone</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <label className="block text-sm font-medium text-text">Location</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </>
        )}
        {step === 1 && (
          <>
            <label className="block text-sm font-medium text-text">Professional summary</label>
            <textarea
              className="w-full min-h-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="2–4 sentences: role, years of experience, top strengths, what you're looking for."
            />
          </>
        )}
        {step === 2 && (
          <>
            <label className="block text-sm font-medium text-text">Experience</label>
            <textarea
              className="w-full min-h-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder={`Job Title — Company\n• Achievement with metric\n• ...\n\nNext role — Company\n• ...`}
            />
          </>
        )}
        {step === 3 && (
          <>
            <label className="block text-sm font-medium text-text">Education</label>
            <textarea
              className="w-full min-h-[100px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Degree, School, Year"
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(buildPlainText());
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
            >
              <Copy className="h-4 w-4" /> Copy full draft
            </button>
            <button
              type="button"
              onClick={openInAnalyzer}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Open in Resume Analyzer →
            </button>
          </>
        )}
      </div>

      <p className="text-xs text-text-muted">
        Prefer uploading a file?{" "}
        <Link href="/resume-analyzer" className="text-primary hover:underline">
          Resume Analyzer
        </Link>
      </p>
    </div>
  );
}
