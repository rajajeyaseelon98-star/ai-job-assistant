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
    <div className="mx-auto w-full max-w-3xl py-8">
      <div>
        <h1 className="font-display flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
          <FileText className="h-7 w-7 text-indigo-600" /> Quick Resume Builder
        </h1>
        <p className="mt-2 text-base text-slate-500">
          Step-by-step draft you can paste into the Resume Analyzer for an ATS score — no file required.
        </p>
      </div>

      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />}
            <span
              className={`whitespace-nowrap ${
                i === step
                  ? "rounded-full border border-indigo-700 bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm"
                  : i < step
                    ? "rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700"
                    : "px-4 py-1.5 text-sm font-medium text-slate-400"
              }`}
            >
              {i + 1}. {label}
            </span>
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        {step === 0 && (
          <div className="space-y-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
            <input
              data-testid="rb-full-name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <input
              type="email"
              data-testid="rb-email"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label className="mb-2 block text-sm font-semibold text-slate-700">Phone</label>
            <input
              data-testid="rb-phone"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <label className="mb-2 block text-sm font-semibold text-slate-700">Location</label>
            <input
              data-testid="rb-location"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>
        )}
        {step === 1 && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Professional summary</label>
            <textarea
              data-testid="rb-summary"
              className="min-h-[160px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="2–4 sentences: role, years of experience, top strengths, what you're looking for."
            />
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Experience</label>
            <textarea
              data-testid="rb-experience"
              className="min-h-[200px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder={`Job Title — Company\n• Achievement with metric\n• ...\n\nNext role — Company\n• ...`}
            />
          </div>
        )}
        {step === 3 && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Education</label>
            <textarea
              data-testid="rb-education"
              className="min-h-[160px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              placeholder="Degree, School, Year"
            />
          </div>
        )}

        <div className="mt-10 flex items-center gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            data-testid="rb-back"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              data-testid="rb-next"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white shadow-sm shadow-indigo-600/20 transition-all hover:bg-indigo-700"
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
                data-testid="rb-copy"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-2.5 font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
              >
                <Copy className="h-4 w-4" /> Copy full draft
              </button>
              <button
                type="button"
                onClick={openInAnalyzer}
                data-testid="rb-open-analyzer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 font-medium text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-violet-700"
              >
                Open in Resume Analyzer →
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-8 block text-center text-sm text-slate-500">
        Prefer uploading a file?{" "}
        <Link href="/resume-analyzer" className="font-medium text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline">
          Resume Analyzer
        </Link>
      </p>
    </div>
  );
}
