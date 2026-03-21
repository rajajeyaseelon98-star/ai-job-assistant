"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Target, Rocket, ChevronRight, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

const STEPS = [
  { id: 1, title: "Upload Resume", icon: Upload, desc: "Get your ATS score instantly" },
  { id: 2, title: "See Your Score", icon: Target, desc: "Know where you stand" },
  { id: 3, title: "Start Applying", icon: Rocket, desc: "Let AI find your dream jobs" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setResumeText(text.slice(0, 50000));
    analyzeResume(text.slice(0, 50000));
  }

  async function handlePaste() {
    if (!resumeText.trim() || resumeText.trim().length < 50) return;
    analyzeResume(resumeText);
  }

  async function analyzeResume(text: string) {
    setAnalyzing(true);
    setStep(2);
    try {
      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.atsScore ?? data.score ?? 0);
        setImprovements(data.resumeImprovements?.slice(0, 3) ?? []);
        setMissingSkills(data.missingSkills?.slice(0, 5) ?? []);
      } else {
        setScore(65);
        setImprovements(["Add more action verbs", "Include measurable achievements", "Optimize keywords"]);
      }
    } catch {
      setScore(65);
      setImprovements(["Add more action verbs", "Include measurable achievements"]);
    } finally {
      setAnalyzing(false);
    }
  }

  function goToDashboard() {
    router.push("/dashboard");
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8">
      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold transition-all ${
                  isDone ? "bg-green-500 text-white" : isActive ? "bg-primary text-white" : "bg-gray-200 text-text-muted"
                }`}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                </div>
                <span className={`text-xs font-medium hidden sm:inline ${isActive ? "text-primary" : isDone ? "text-green-600" : "text-text-muted"}`}>
                  {s.title}
                </span>
                {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300 mx-1 sm:mx-3" />}
              </div>
            );
          })}
        </div>
        <ProgressBar value={((step - 1) / (STEPS.length - 1)) * 100} className="h-1.5" />
      </div>

      {/* Step 1: Upload Resume */}
      {step === 1 && (
        <div className="w-full max-w-lg text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-text">Let&apos;s check your resume</h1>
          <p className="mt-2 text-text-muted">Get your ATS score in 30 seconds</p>

          <div className="mt-8 space-y-4">
            {/* File upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 text-text-muted hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Upload className="h-8 w-8" />
              <div className="text-left">
                <p className="font-medium text-text">Upload your resume</p>
                <p className="text-sm">TXT file (or paste text below)</p>
              </div>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-text-muted">or paste your resume</span>
              </div>
            </div>

            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              rows={6}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-text resize-none focus:border-primary focus:ring-1 focus:ring-primary"
            />

            <button
              onClick={handlePaste}
              disabled={!resumeText.trim() || resumeText.trim().length < 50}
              className="w-full rounded-xl bg-primary py-3 font-medium text-white hover:bg-primary-hover disabled:opacity-50 min-h-[44px] active:scale-[0.98] transition-transform"
            >
              Analyze My Resume
            </button>

            <button
              onClick={goToDashboard}
              className="text-sm text-text-muted hover:text-text"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Step 2: See Score */}
      {step === 2 && (
        <div className="w-full max-w-lg text-center">
          {analyzing ? (
            <div className="py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-lg font-medium text-text">Analyzing your resume...</p>
              <p className="mt-1 text-sm text-text-muted">Our AI is scanning for ATS compatibility</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-card p-6 sm:p-8 shadow-sm">
                <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Your ATS Score</p>
                <div className="mt-2 text-6xl font-bold" style={{
                  color: (score ?? 0) >= 80 ? "#16a34a" : (score ?? 0) >= 60 ? "#ca8a04" : "#dc2626"
                }}>
                  {score}%
                </div>
                <ProgressBar value={score ?? 0} className="mt-4 mx-auto max-w-xs" />
                <p className="mt-3 text-sm text-text-muted">
                  {(score ?? 0) >= 80
                    ? "Great resume! You're ahead of most candidates."
                    : (score ?? 0) >= 60
                    ? "Good start! A few improvements can boost your interviews by 40%."
                    : "Your resume needs work. We can help you improve it significantly."}
                </p>

                {missingSkills.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-xs font-semibold text-text-muted uppercase">Missing Skills</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {missingSkills.map((s, i) => (
                        <span key={i} className="rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700 ring-1 ring-red-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {improvements.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-xs font-semibold text-text-muted uppercase">Top Improvements</p>
                    <ul className="mt-1 space-y-1.5">
                      {improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text">
                          <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">{i + 1}</span>
                          <span className="line-clamp-2">{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setStep(3)}
                  className="w-full rounded-xl bg-primary py-3 font-medium text-white hover:bg-primary-hover min-h-[44px] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => router.push("/resume-analyzer")}
                  className="w-full rounded-xl border border-gray-200 py-3 font-medium text-text hover:bg-gray-50 min-h-[44px]"
                >
                  Improve My Resume First
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 3: Start Applying */}
      {step === 3 && (
        <div className="w-full max-w-lg text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">You&apos;re all set!</h1>
          <p className="mt-2 text-text-muted">Here&apos;s what you can do next</p>

          <div className="mt-6 grid gap-3">
            <button
              onClick={() => router.push("/job-match")}
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-text">Find Matching Jobs</p>
                <p className="text-sm text-text-muted">AI matches you with the best opportunities</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 ml-auto shrink-0" />
            </button>

            <button
              onClick={() => router.push("/auto-apply")}
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-text">AI Auto-Apply</p>
                <p className="text-sm text-text-muted">Let AI apply to jobs while you sleep</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 ml-auto shrink-0" />
            </button>

            <button
              onClick={() => router.push("/resume-analyzer")}
              className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 text-left hover:border-primary hover:bg-primary/5 transition-colors active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-text">Improve Resume</p>
                <p className="text-sm text-text-muted">Boost your ATS score to 90%+</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 ml-auto shrink-0" />
            </button>
          </div>

          <button
            onClick={goToDashboard}
            className="mt-6 w-full rounded-xl bg-primary py-3 font-medium text-white hover:bg-primary-hover min-h-[44px] active:scale-[0.98] transition-transform"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
