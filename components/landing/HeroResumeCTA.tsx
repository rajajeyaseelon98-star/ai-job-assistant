"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { Upload, Sparkles, Loader2, Check, FileText, Zap, Lock, TrendingUp } from "lucide-react";

import { JOB_SEEKER_SIGNUP } from "./landingPaths";
import { landingContainer } from "./landingShell";

const LANDING_DRAFT_KEY = "landingResumeDraft";
const SIGNUP_HREF = JOB_SEEKER_SIGNUP;

type UserType = "experienced" | "fresher";

export function HeroResumeCTA() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>("experienced");
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [pastedText, setPastedText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("Analyzing resume…");
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) {
      setProgress(0);
      return;
    }
    setProgress(12);
    const t = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + Math.random() * 15 + 5));
    }, 220);
    return () => clearInterval(t);
  }, [busy]);

  const pushSignup = useCallback(() => {
    router.push(SIGNUP_HREF);
  }, [router]);

  const storeDraftAndSignup = useCallback(
    (text: string) => {
      try {
        sessionStorage.setItem(LANDING_DRAFT_KEY, text.trim());
      } catch {
        /* ignore */
      }
      pushSignup();
    },
    [pushSignup]
  );

  const extractViaApi = useCallback(
    async (file: File) => {
      setLocalError(null);
      setBusyMessage("Analyzing resume…");
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/public/extract-resume", {
          method: "POST",
          body: fd,
        });
        const data = (await res.json()) as { error?: string; text?: string };
        if (!res.ok || !data.text) {
          setLocalError(data.error ?? "Could not read this file. Try pasting your resume text.");
          return;
        }
        storeDraftAndSignup(data.text);
      } catch {
        setLocalError("Something went wrong. Try again or paste your resume text.");
      } finally {
        setBusy(false);
      }
    },
    [storeDraftAndSignup]
  );

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      setLocalError(null);
      const name = file.name.toLowerCase();

      if (name.endsWith(".txt") || file.type === "text/plain") {
        setBusyMessage("Analyzing resume…");
        setBusy(true);
        const reader = new FileReader();
        reader.onload = () => {
          const t = String(reader.result ?? "").trim();
          setBusy(false);
          if (t.length < 20) {
            setLocalError("Not enough text in file. Paste your resume or try another file.");
            return;
          }
          storeDraftAndSignup(t);
        };
        reader.onerror = () => {
          setBusy(false);
          setLocalError("Could not read file.");
        };
        reader.readAsText(file);
        return;
      }

      if (
        name.endsWith(".pdf") ||
        file.type === "application/pdf" ||
        name.endsWith(".docx") ||
        file.type.includes("wordprocessingml")
      ) {
        void extractViaApi(file);
        return;
      }

      setLocalError("Please upload PDF, DOCX, or TXT — or paste your resume text.");
    },
    [extractViaApi, storeDraftAndSignup]
  );

  const handlePrimaryExperienced = () => {
    setLocalError(null);
    if (inputMode === "paste") {
      const t = pastedText.trim();
      if (t.length < 20) {
        setLocalError("Paste at least a few lines of your resume, or switch to upload.");
        return;
      }
      setBusyMessage("Analyzing resume…");
      setBusy(true);
      window.setTimeout(() => {
        setBusy(false);
        storeDraftAndSignup(t);
      }, 600);
      return;
    }
    document.getElementById("hero-resume-file-input")?.click();
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-slate-950 to-black text-white">
      <div className={`${landingContainer} py-14 md:py-20`}>
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.15em] text-blue-200/90">
          We get you interviews automatically
        </p>

        {/* Experienced / Fresher */}
        <div className="mx-auto mb-10 inline-flex w-full max-w-md rounded-full border border-white/20 bg-white/5 p-1.5 backdrop-blur-sm sm:max-w-lg">
          <button
            type="button"
            onClick={() => {
              setUserType("experienced");
              setLocalError(null);
            }}
            className={`min-h-[44px] flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              userType === "experienced" ? "bg-white text-slate-900 shadow-lg" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Experienced
          </button>
          <button
            type="button"
            onClick={() => {
              setUserType("fresher");
              setLocalError(null);
            }}
            className={`min-h-[44px] flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
              userType === "fresher" ? "bg-white text-slate-900 shadow-lg" : "text-slate-300 hover:bg-white/10"
            }`}
          >
            Fresher
          </button>
        </div>

        <div className="transition-all duration-300 ease-out">
          {userType === "experienced" ? (
            <ExperiencedPanel
              inputMode={inputMode}
              setInputMode={setInputMode}
              pastedText={pastedText}
              setPastedText={setPastedText}
              dragOver={dragOver}
              setDragOver={setDragOver}
              busy={busy}
              busyMessage={busyMessage}
              progress={progress}
              localError={localError}
              onDropFile={handleFile}
              onPrimary={handlePrimaryExperienced}
              onFileInput={(f) => handleFile(f)}
            />
          ) : (
            <FresherPanel />
          )}
        </div>
      </div>
    </section>
  );
}

function ProofStrip() {
  return (
    <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {[
        { icon: TrendingUp, label: "ATS score", value: "78%", hint: "↑ vs avg" },
        { icon: Sparkles, label: "Issues found", value: "12", hint: "fixable fast" },
        { icon: Zap, label: "Matching jobs", value: "35", hint: "best-fit" },
        { icon: Check, label: "Interview chance", value: "HIGH", hint: "predicted" },
      ].map((m) => (
        <div
          key={m.label}
          className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-left shadow-lg shadow-black/20 backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15"
        >
          <m.icon className="h-5 w-5 text-blue-200" aria-hidden />
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{m.value}</p>
          <p className="text-xs font-medium text-slate-300">{m.label}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{m.hint}</p>
        </div>
      ))}
    </div>
  );
}

function ExperiencedPanel({
  inputMode,
  setInputMode,
  pastedText,
  setPastedText,
  dragOver,
  setDragOver,
  busy,
  busyMessage,
  progress,
  localError,
  onDropFile,
  onPrimary,
  onFileInput,
}: {
  inputMode: "upload" | "paste";
  setInputMode: (m: "upload" | "paste") => void;
  pastedText: string;
  setPastedText: (t: string) => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  busy: boolean;
  busyMessage: string;
  progress: number;
  localError: string | null;
  onDropFile: (f: File | null) => void;
  onPrimary: () => void;
  onFileInput: (f: File | null) => void;
}) {
  return (
    <div>
      <h1 className="text-balance text-center text-3xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
        Stop Applying.
        <span className="mt-2 block bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
          Start Getting Interviews.
        </span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-center text-base text-slate-300 md:text-lg">
        We fix your resume, match you to jobs, and apply automatically.
      </p>

      {/* Outcome first — before friction */}
      <ProofStrip />

      <p className="mb-6 text-center text-xs font-medium text-slate-400">
        Takes 30 seconds · Instant results · No credit card
      </p>

      <div className="mx-auto max-w-xl text-left">
        {busy ? (
          <div
            className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
            role="status"
            aria-live="polite"
          >
            <div className="flex flex-col items-center py-6">
              <Loader2 className="h-11 w-11 animate-spin text-blue-200" />
              <p className="mt-4 text-center text-base font-semibold">{busyMessage}</p>
              <div className="mt-5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-400 transition-[width] duration-300 ease-out"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">Checking ATS signals &amp; structure…</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`group rounded-2xl border-2 p-4 text-left transition-all duration-200 sm:p-5 ${
                  inputMode === "upload"
                    ? "border-white bg-white/15 shadow-lg"
                    : "border-white/20 bg-white/5 hover:border-white/40"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  📄
                </span>
                <span className="mt-2 flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                  <Upload className="h-4 w-4 text-blue-200 transition-transform group-hover:scale-105" />
                  Upload Resume
                </span>
                <span className="mt-1 block text-xs text-slate-400">PDF, DOCX, TXT</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode("paste")}
                className={`group rounded-2xl border-2 p-4 text-left transition-all duration-200 sm:p-5 ${
                  inputMode === "paste"
                    ? "border-white bg-white/15 shadow-lg"
                    : "border-white/20 bg-white/5 hover:border-white/40"
                }`}
              >
                <span className="text-2xl" aria-hidden>
                  📋
                </span>
                <span className="mt-2 flex items-center gap-2 text-sm font-bold text-white sm:text-base">
                  <FileText className="h-4 w-4 text-blue-200 transition-transform group-hover:scale-105" />
                  Paste Resume
                </span>
                <span className="mt-1 block text-xs text-slate-400">Copy &amp; paste text</span>
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400 sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                Takes 30 seconds
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
                Your data is secure
              </span>
            </div>

            {inputMode === "upload" ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  onDropFile(e.dataTransfer.files?.[0] ?? null);
                }}
                className={`mt-4 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 ${
                  dragOver ? "border-blue-300 bg-white/15 scale-[1.01]" : "border-white/25 bg-white/5"
                }`}
              >
                <Upload className="mx-auto h-9 w-9 text-blue-200" aria-hidden />
                <p className="mt-2 text-sm font-medium text-white">Drop your file here</p>
                <label className="mt-3 inline-block cursor-pointer">
                  <span className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-md transition hover:scale-[1.03] hover:shadow-lg">
                    Browse files
                  </span>
                  <input
                    id="hero-resume-file-input"
                    type="file"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => onFileInput(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            ) : (
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your full resume text here…"
                rows={8}
                className="mt-4 min-h-[200px] w-full resize-y rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            )}

            {localError && (
              <p className="mt-3 rounded-xl border border-red-400/40 bg-red-500/20 px-3 py-2 text-sm text-red-100" role="alert">
                {localError}
              </p>
            )}

            <button
              type="button"
              onClick={onPrimary}
              className="group mt-6 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-slate-900 shadow-xl transition hover:scale-[1.03] hover:shadow-2xl active:scale-[0.99]"
            >
              <Sparkles className="h-5 w-5 shrink-0 transition group-hover:rotate-12" />
              Upload &amp; Get My Score →
            </button>

            <p className="mt-5 text-center text-xs text-slate-400 sm:text-sm">
              Trusted by 10,000+ job seekers · Used by teams hiring in India
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function FresherPanel() {
  return (
    <div>
      <h1 className="text-balance text-center text-3xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
        No resume?
        <span className="mt-2 block text-blue-200">Create one in 60 seconds.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-center text-base text-slate-300 md:text-lg">
        Answer a few questions — our AI builds a professional resume and applies to jobs for you.
      </p>

      <div className="mb-10 grid grid-cols-3 gap-3 md:gap-4">
        {[
          { v: "60s", l: "Resume draft", h: "guided AI" },
          { v: "ATS", l: "Format", h: "recruiter-ready" },
          { v: "1-click", l: "Apply path", h: "after signup" },
        ].map((x) => (
          <div
            key={x.v}
            className="rounded-2xl border border-white/15 bg-white/10 px-3 py-4 text-center backdrop-blur-md"
          >
            <p className="text-xl font-bold">{x.v}</p>
            <p className="text-[11px] text-slate-400">{x.l}</p>
            <p className="text-[10px] text-slate-500">{x.h}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-4 max-w-xl">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl">✨</span>
            <div>
              <p className="text-sm font-bold text-white">Create Resume with AI</p>
              <p className="text-xs text-slate-400">Guided questions → ready to apply</p>
            </div>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-slate-200">
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              No experience needed
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              ATS-friendly format
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              Built for real jobs
            </li>
          </ul>
          <Link
            href="/create-resume"
            className="mt-8 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-slate-900 shadow-xl transition hover:scale-[1.03] active:scale-[0.99]"
          >
            <Sparkles className="h-5 w-5" aria-hidden />
            Create My Resume →
          </Link>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          Takes 30 seconds · Instant results · Trusted by 10,000+ job seekers
        </p>
      </div>
    </div>
  );
}
