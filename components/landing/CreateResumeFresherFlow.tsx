"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";

import { JOB_SEEKER_SIGNUP } from "./landingPaths";

const LANDING_DRAFT_KEY = "landingResumeDraft";
const SIGNUP_HREF = JOB_SEEKER_SIGNUP;

type Step = 1 | 2 | 3 | 4;

export function CreateResumeFresherFlow() {
  const [step, setStep] = useState<Step>(1);
  const [desiredRole, setDesiredRole] = useState("");
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [projects, setProjects] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [atsScore, setAtsScore] = useState<number | null>(null);

  const canNext1 = desiredRole.trim().length >= 2;
  const canNext2 = education.trim().length >= 10;
  const canNext3 = skills.trim().length >= 3;

  async function generate() {
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/public/fresher-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desiredRole: desiredRole.trim(),
          education: education.trim(),
          skills: skills.trim(),
          projects: projects.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string; resumeText?: string; atsScore?: number };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      if (!data.resumeText) {
        setError("Could not generate resume. Try again.");
        return;
      }
      setResumeText(data.resumeText);
      setAtsScore(typeof data.atsScore === "number" ? data.atsScore : 75);
      try {
        sessionStorage.setItem(LANDING_DRAFT_KEY, data.resumeText);
      } catch {
        /* ignore */
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  if (resumeText && atsScore !== null) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Your draft resume</p>
          <div className="mt-4 max-h-64 overflow-y-auto rounded-lg bg-surface-muted p-4 text-left text-xs text-foreground whitespace-pre-wrap sm:text-sm">
            {resumeText}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface-muted/80 px-4 py-3">
            <span className="text-sm font-medium text-text-muted">Indicative ATS score</span>
            <span className="text-2xl font-bold text-primary">{atsScore}%</span>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Full analysis and improvements after you create a free account.
          </p>
          <Link
            href={SIGNUP_HREF}
            className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-card transition hover:bg-primary-hover"
          >
            Continue free — unlock full score &amp; auto-apply
            <Sparkles className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {generating ? (
        <div
          className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-12 shadow-card"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-center text-base font-medium text-foreground">Generating your resume…</p>
          <p className="mt-1 text-center text-sm text-text-muted">This usually takes a few seconds</p>
        </div>
      ) : (
        <div
          className="rounded-xl border border-border bg-card p-5 shadow-card transition-opacity duration-200 sm:p-6"
          key={step}
        >
          <div className="mb-4 flex gap-1">
            {([1, 2, 3, 4] as const).map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="text-left">
              <label htmlFor="role" className="text-sm font-medium text-foreground">
                Desired job role
              </label>
              <p className="mt-1 text-xs text-text-muted">We&apos;ll tailor keywords for this role</p>
              <input
                id="role"
                value={desiredRole}
                onChange={(e) => setDesiredRole(e.target.value)}
                placeholder="e.g. Software Engineer, Marketing Associate"
                className="input-field mt-3 min-h-[48px] w-full"
                autoComplete="off"
              />
            </div>
          )}

          {step === 2 && (
            <div className="text-left">
              <label htmlFor="edu" className="text-sm font-medium text-foreground">
                Education
              </label>
              <p className="mt-1 text-xs text-text-muted">Degree, college, year, CGPA if you want</p>
              <textarea
                id="edu"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="B.Tech Computer Science, XYZ University, 2024 — CGPA 8.2"
                rows={5}
                className="input-field mt-3 w-full resize-y py-3 text-sm"
              />
            </div>
          )}

          {step === 3 && (
            <div className="text-left">
              <label htmlFor="skills" className="text-sm font-medium text-foreground">
                Skills
              </label>
              <p className="mt-1 text-xs text-text-muted">Technical and soft skills — comma or line separated</p>
              <textarea
                id="skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Python, SQL, Communication, Teamwork"
                rows={4}
                className="input-field mt-3 w-full resize-y py-3 text-sm"
              />
            </div>
          )}

          {step === 4 && (
            <div className="text-left">
              <label htmlFor="proj" className="text-sm font-medium text-foreground">
                Projects / internships{" "}
                <span className="font-normal text-text-muted">(optional)</span>
              </label>
              <p className="mt-1 text-xs text-text-muted">Short bullets are fine — we&apos;ll polish the wording</p>
              <textarea
                id="proj"
                value={projects}
                onChange={(e) => setProjects(e.target.value)}
                placeholder="Built a chat app with React; 2-month internship at ABC Corp"
                rows={5}
                className="input-field mt-3 w-full resize-y py-3 text-sm"
              />
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
                className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-text-muted hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <span />
            )}

            {step < 4 ? (
              <button
                type="button"
                disabled={
                  (step === 1 && !canNext1) || (step === 2 && !canNext2) || (step === 3 && !canNext3)
                }
                onClick={() => setStep((s) => (s < 4 ? ((s + 1) as Step) : s))}
                className="inline-flex min-h-[44px] items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void generate()}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                <Sparkles className="h-4 w-4" />
                Generate my resume
              </button>
            )}
          </div>

          <ul className="mt-6 space-y-2 border-t border-border pt-4 text-left text-xs text-text-muted sm:text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" />
              No experience needed
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" />
              Perfect for students &amp; freshers
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary" />
              ATS-friendly resume instantly
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
