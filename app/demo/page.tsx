"use client";

import { useState } from "react";
import Link from "next/link";
import { Upload, Loader2, Lock } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default function DemoPage() {
  const [resumeText, setResumeText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  async function handleAnalyze() {
    if (!resumeText.trim() || resumeText.trim().length < 50) return;
    setAnalyzing(true);
    // Simulate a quick analysis (no real API call — demo mode)
    await new Promise((r) => setTimeout(r, 2000));

    // Generate a plausible score based on text length and keyword density
    const text = resumeText.toLowerCase();
    let baseScore = 55;
    const keywords = ["experience", "skills", "project", "team", "led", "managed", "developed", "built", "achieved", "increased", "reduced", "improved"];
    const found = keywords.filter((k) => text.includes(k));
    baseScore += found.length * 3;
    baseScore = Math.min(85, Math.max(40, baseScore + Math.floor(Math.random() * 10)));
    setScore(baseScore);
    setAnalyzing(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-200 bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-lg font-semibold text-primary">
            AI Job Assistant
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-text-muted hover:text-text text-sm">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover min-h-[40px] inline-flex items-center"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text">Try Your ATS Score (Free)</h1>
          <p className="mt-2 text-text-muted">Paste your resume below to see a preview of your score</p>
        </div>

        {score === null ? (
          <div className="space-y-4">
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              rows={10}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-text resize-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !resumeText.trim() || resumeText.trim().length < 50}
              className="w-full rounded-xl bg-primary py-3 font-medium text-white hover:bg-primary-hover disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5" />
                  Check My Score
                </>
              )}
            </button>
            <p className="text-center text-xs text-text-muted">
              No account needed for preview &middot; Full analysis requires free signup
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score Preview */}
            <div className="rounded-2xl border border-gray-200 bg-card p-6 sm:p-8 shadow-sm text-center">
              <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Your Estimated ATS Score</p>
              <div className="mt-2 text-6xl font-bold" style={{
                color: score >= 80 ? "#16a34a" : score >= 60 ? "#ca8a04" : "#dc2626"
              }}>
                {score}%
              </div>
              <ProgressBar value={score} className="mt-4 mx-auto max-w-xs" />
              <p className="mt-3 text-sm text-text-muted">
                {score >= 70
                  ? "Looking good! Sign up to get detailed improvements."
                  : "Your resume needs optimization. We can help you boost it to 90%+."}
              </p>
            </div>

            {/* Blurred/Locked Sections */}
            <div className="relative rounded-xl border border-gray-200 bg-card p-6 overflow-hidden">
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <Lock className="h-8 w-8 text-primary mb-2" />
                <p className="font-semibold text-text">Sign up to unlock full analysis</p>
                <p className="text-sm text-text-muted mt-1">Missing skills, improvements, job matches & more</p>
                <Link
                  href="/signup"
                  className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover active:scale-[0.98] transition-transform"
                >
                  Unlock Full Report (Free)
                </Link>
              </div>
              <div className="space-y-3 select-none" aria-hidden="true">
                <h3 className="text-sm font-semibold text-text-muted">Missing Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Node.js", "AWS", "Docker"].map((s) => (
                    <span key={s} className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">{s}</span>
                  ))}
                </div>
                <h3 className="text-sm font-semibold text-text-muted mt-4">Top Improvements</h3>
                <ul className="space-y-1 text-sm text-text-muted">
                  <li>1. Add measurable achievements with metrics</li>
                  <li>2. Include more industry keywords</li>
                  <li>3. Optimize formatting for ATS systems</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="flex-1 rounded-xl bg-primary py-3 text-center font-medium text-white hover:bg-primary-hover min-h-[44px] flex items-center justify-center active:scale-[0.98] transition-transform"
              >
                Sign Up for Full Analysis (Free)
              </Link>
              <button
                onClick={() => { setScore(null); setResumeText(""); }}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-center font-medium text-text hover:bg-gray-50 min-h-[44px]"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
