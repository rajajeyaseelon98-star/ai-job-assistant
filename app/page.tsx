"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Briefcase } from "lucide-react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"job_seeker" | "recruiter">("job_seeker");

  const signupHref = `/signup?role=${activeTab}`;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navbar */}
      <header className="border-b border-gray-200 bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <span className="text-lg sm:text-xl font-semibold text-primary">
            AI Job Assistant
          </span>
          <nav className="hidden sm:flex items-center gap-4">
            <Link href="/jobs" className="text-text-muted hover:text-text text-sm sm:text-base">
              Jobs
            </Link>
            <button
              onClick={() => setActiveTab("recruiter")}
              className="text-text-muted hover:text-text text-sm sm:text-base bg-transparent border-none cursor-pointer"
            >
              For Recruiters
            </button>
            <button
              onClick={() => setActiveTab("job_seeker")}
              className="text-text-muted hover:text-text text-sm sm:text-base bg-transparent border-none cursor-pointer"
            >
              For Job Seekers
            </button>
            <Link href="/pricing" className="text-text-muted hover:text-text text-sm sm:text-base">
              Pricing
            </Link>
            <Link href="/login" className="text-text-muted hover:text-text text-sm sm:text-base">
              Login
            </Link>
            <Link
              href={signupHref}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-hover text-sm sm:text-base min-h-[44px] inline-flex items-center"
            >
              Get Started Free
            </Link>
          </nav>
          {/* Mobile nav */}
          <div className="flex sm:hidden items-center gap-3">
            <Link href="/login" className="text-text-muted hover:text-text text-sm">
              Login
            </Link>
            <Link
              href={signupHref}
              className="rounded-lg bg-primary px-3 py-2 text-sm text-white hover:bg-primary-hover min-h-[44px] inline-flex items-center"
            >
              Get Started
            </Link>
          </div>
        </div>
        {/* Mobile secondary nav */}
        <div className="flex sm:hidden items-center justify-center gap-6 border-t border-gray-100 px-4 py-2">
          <Link href="/jobs" className="text-text-muted hover:text-text text-sm">
            Jobs
          </Link>
          <button
            onClick={() => setActiveTab("recruiter")}
            className="text-text-muted hover:text-text text-sm bg-transparent border-none cursor-pointer"
          >
            Recruiters
          </button>
          <button
            onClick={() => setActiveTab("job_seeker")}
            className="text-text-muted hover:text-text text-sm bg-transparent border-none cursor-pointer"
          >
            Job Seekers
          </button>
          <Link href="/pricing" className="text-text-muted hover:text-text text-sm">
            Pricing
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Role Tabs */}
        <div className="flex justify-center pt-8 sm:pt-12">
          <div className="inline-flex rounded-xl border border-gray-200 bg-card p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("job_seeker")}
              className={`flex items-center gap-2 rounded-lg px-4 sm:px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === "job_seeker"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text hover:bg-gray-50"
              }`}
            >
              <User className="h-4 w-4" />
              <span>I&apos;m a Job Seeker</span>
            </button>
            <button
              onClick={() => setActiveTab("recruiter")}
              className={`flex items-center gap-2 rounded-lg px-4 sm:px-6 py-2.5 text-sm font-medium transition-all ${
                activeTab === "recruiter"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:text-text hover:bg-gray-50"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>I&apos;m a Recruiter</span>
            </button>
          </div>
        </div>

        {/* ===== JOB SEEKER CONTENT ===== */}
        {activeTab === "job_seeker" && (
          <>
            {/* Hero */}
            <section className="py-10 sm:py-14 md:py-16 text-center">
              <div className="mx-auto max-w-3xl">
                <span className="mb-4 inline-block rounded-full bg-green-100 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-green-700">
                  Join 10,000+ candidates getting more interviews
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-text">
                  Get 3x More Interviews<br />
                  <span className="text-primary">Without Applying Manually</span>
                </h1>
                <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-sm sm:text-base lg:text-lg text-text-muted">
                  Upload your resume once. Our AI finds matching jobs, optimizes your profile, and applies for you automatically.
                </p>
                <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    href={signupHref}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-primary px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-white shadow-lg hover:bg-primary-hover active:scale-[0.98] transition-transform min-h-[44px]"
                  >
                    Check My Resume Score (Free) &rarr;
                  </Link>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-text-muted">
                  No credit card required &middot; Takes 30 seconds
                </p>
              </div>
            </section>

            {/* Social Proof */}
            <section className="border-b border-t border-gray-100 py-6 sm:py-8">
              <div className="grid grid-cols-2 gap-4 sm:gap-8 sm:flex sm:flex-wrap items-center justify-center text-center text-xs sm:text-sm text-text-muted">
                <div>
                  <span className="block text-xl sm:text-2xl font-bold text-text">3.2x</span>
                  More interviews on average
                </div>
                <div className="hidden sm:block h-8 w-px bg-gray-200" />
                <div>
                  <span className="block text-xl sm:text-2xl font-bold text-text">89%</span>
                  Resume pass rate
                </div>
                <div className="hidden sm:block h-8 w-px bg-gray-200" />
                <div>
                  <span className="block text-xl sm:text-2xl font-bold text-text">50K+</span>
                  Jobs matched daily
                </div>
                <div className="hidden sm:block h-8 w-px bg-gray-200" />
                <div>
                  <span className="block text-xl sm:text-2xl font-bold text-text">₹0</span>
                  To get started
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="py-12 sm:py-16 md:py-20">
              <h2 className="text-center text-xl sm:text-2xl font-bold text-text">
                Upload &rarr; Score &rarr; Apply
              </h2>
              <p className="mt-2 text-center text-sm sm:text-base text-text-muted">Three steps to your next interview</p>
              <div className="mt-8 sm:mt-10 grid gap-8 sm:gap-6 grid-cols-1 md:grid-cols-3">
                {[
                  { step: "1", title: "Upload Your Resume", desc: "Get instant ATS score and find out why recruiters skip your profile.", highlight: "Takes 30 seconds" },
                  { step: "2", title: "AI Finds & Applies", desc: "We match you with the right jobs and auto-apply while you sleep.", highlight: "Set it and forget it" },
                  { step: "3", title: "Track & Improve", desc: "See what works, improve your resume, and get more interviews.", highlight: "Data-driven decisions" },
                ].map((s) => (
                  <div key={s.step} className="text-center">
                    <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary text-lg sm:text-xl font-bold text-white">
                      {s.step}
                    </div>
                    <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-text">{s.title}</h3>
                    <p className="mt-2 text-sm sm:text-base text-text-muted">{s.desc}</p>
                    <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{s.highlight}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Value Section */}
            <section className="rounded-2xl bg-gray-50 p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text">
                    See Exactly Why You&apos;re<br />
                    <span className="text-primary">Not Getting Interviews</span>
                  </h2>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-text-muted">
                    Our AI analyzes every job for your exact match probability and tells you what to fix.
                  </p>
                  <ul className="mt-4 sm:mt-6 space-y-3 text-sm">
                    {[
                      ["Resume Score (ATS optimized)", "Know exactly where your resume fails"],
                      ["Interview Probability Score", "Real-time prediction per job"],
                      ["AI Resume Fix Suggestions", "Specific fixes to improve your chances"],
                      ["Smart Auto-Apply to Best Jobs", "AI applies while you sleep"],
                    ].map(([title, desc]) => (
                      <li key={title} className="flex items-start gap-2">
                        <span className="mt-0.5 text-green-500">&#10003;</span>
                        <div><strong>{title}</strong> &mdash; {desc}</div>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={signupHref}
                    className="mt-5 sm:mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 sm:px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover min-h-[44px] w-full sm:w-auto active:scale-[0.98] transition-transform"
                  >
                    Try It Free &rarr;
                  </Link>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-xs rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-lg">
                    <div className="text-center">
                      <div className="text-4xl sm:text-5xl font-bold text-green-500">78%</div>
                      <p className="mt-1 text-xs sm:text-sm font-medium text-text">Interview Probability</p>
                    </div>
                    <div className="mt-3 sm:mt-4 space-y-2 text-xs text-text-muted">
                      <div className="flex justify-between"><span>Skill Match</span><span className="font-medium text-green-600">85%</span></div>
                      <div className="flex justify-between"><span>Experience Fit</span><span className="font-medium text-green-600">70%</span></div>
                      <div className="flex justify-between"><span>Resume Quality</span><span className="font-medium text-yellow-600">Improved</span></div>
                      <div className="flex justify-between"><span>Job Match Score</span><span className="font-medium text-green-600">High</span></div>
                    </div>
                    <div className="mt-3 sm:mt-4 rounded-lg bg-green-50 p-2 text-center text-[11px] text-green-700">
                      From applying blindly &rarr; Getting calls daily
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing — Job Seeker */}
            <section className="py-12 sm:py-16 md:py-20 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-text">Simple pricing</h2>
              <p className="mt-2 text-sm sm:text-base text-text-muted">Start free. Upgrade when you see results.</p>
              <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                <div className="rounded-xl border border-gray-200 p-4 sm:p-6 text-left">
                  <p className="font-semibold">Free</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold">₹0</p>
                  <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-text-muted">
                    <li>&#10003; 1 Resume Analysis</li>
                    <li>&#10003; Basic ATS Score</li>
                    <li>&#10003; Limited job matches</li>
                  </ul>
                </div>
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 sm:p-6 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-primary">Pro</p>
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold">
                    ₹299<span className="text-sm font-normal text-text-muted">/mo</span>
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Best for serious job seekers</p>
                  <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-text-muted">
                    <li>&#10003; Unlimited Resume Scans</li>
                    <li>&#10003; Auto-apply to 100+ jobs/day</li>
                    <li>&#10003; AI Resume Improvements</li>
                    <li>&#10003; Interview Boost Score</li>
                  </ul>
                  <Link
                    href={signupHref}
                    className="mt-4 rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-white hover:bg-primary-hover min-h-[44px] flex items-center justify-center active:scale-[0.98] transition-transform"
                  >
                    Start Free Trial
                  </Link>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 sm:p-6 text-left sm:col-span-2 lg:col-span-1">
                  <p className="font-semibold">Premium</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold">
                    ₹499<span className="text-sm font-normal text-text-muted">/mo</span>
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Get hired faster</p>
                  <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-text-muted">
                    <li>&#10003; Everything in Pro</li>
                    <li>&#10003; Priority Applications</li>
                    <li>&#10003; Profile Boost (more visibility)</li>
                    <li>&#10003; Salary Insights &amp; targeting</li>
                  </ul>
                  <Link
                    href={signupHref}
                    className="mt-4 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-text hover:bg-gray-50 min-h-[44px] flex items-center justify-center active:scale-[0.98] transition-transform"
                  >
                    Get Premium
                  </Link>
                </div>
              </div>
            </section>

            {/* Consistency / Retention */}
            <section className="py-12 sm:py-16 md:py-20">
              <h2 className="text-center text-xl sm:text-2xl font-bold text-text">Stay Consistent. Get More Interviews.</h2>
              <p className="mt-2 text-center text-sm sm:text-base text-text-muted">
                Maintain your daily streak and unlock real rewards.
              </p>
              <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3">
                {[
                  { days: "7 days", reward: "Free auto-applies" },
                  { days: "14 days", reward: "Profile Boost" },
                  { days: "30 days", reward: "Extra visibility" },
                ].map((r) => (
                  <div key={r.days} className="rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-5 text-center">
                    <div className="mt-1 sm:mt-2 text-sm sm:text-base font-bold text-text">{r.days}</div>
                    <div className="mt-1 text-xs sm:text-sm text-primary">{r.reward}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Final CTA — Job Seeker */}
            <section className="rounded-2xl bg-primary/5 border border-primary/20 p-6 sm:p-8 md:p-12 text-center mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-text">
                Stop Applying. Start Getting Interviews.
              </h2>
              <div className="mt-6 flex justify-center">
                <Link
                  href={signupHref}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-primary px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-white shadow-lg hover:bg-primary-hover active:scale-[0.98] transition-transform min-h-[44px]"
                >
                  Check My Resume Score (Free) &rarr;
                </Link>
              </div>
            </section>
          </>
        )}

        {/* ===== RECRUITER CONTENT ===== */}
        {activeTab === "recruiter" && (
          <>
            {/* Hero */}
            <section className="py-10 sm:py-14 md:py-16 text-center">
              <div className="mx-auto max-w-3xl">
                <span className="mb-4 inline-block rounded-full bg-blue-100 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-blue-700">
                  Trusted by 500+ recruiters across India
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-text">
                  Hire Top 10 Candidates<br />
                  <span className="text-primary">in 5 Seconds</span>
                </h1>
                <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-sm sm:text-base lg:text-lg text-text-muted">
                  Post a job once. Our AI scans, ranks, and shortlists the best candidates instantly.
                </p>
                <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    href={signupHref}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-primary px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-white shadow-lg hover:bg-primary-hover active:scale-[0.98] transition-transform min-h-[44px]"
                  >
                    Start Hiring for Free &rarr;
                  </Link>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-text-muted">
                  No credit card required &middot; Post job in 2 minutes
                </p>
              </div>
            </section>

            {/* Social Proof — Recruiter */}
            <section className="border-b border-t border-gray-100 py-6 sm:py-8">
              <div className="grid grid-cols-2 gap-4 sm:gap-8 sm:flex sm:flex-wrap items-center justify-center text-center text-xs sm:text-sm text-text-muted">
                <div>
                  <span className="block text-xl sm:text-2xl font-bold text-text">5 sec</span>
                  To shortlist candidates
                </div>
                <div className="hidden sm:block h-8 w-px bg-gray-200" />
                <div>
                  <span className="block text-xl sm:text-2xl font-bold text-text">92%</span>
                  Matching accuracy
                </div>
                <div className="hidden sm:block h-8 w-px bg-gray-200" />
                <div>
                  <span className="block text-xl sm:text-2xl font-bold text-text">3x</span>
                  Faster hiring
                </div>
                <div className="hidden sm:block h-8 w-px bg-gray-200" />
                <div>
                  <span className="block text-xl sm:text-2xl font-bold text-text">₹0</span>
                  To start
                </div>
              </div>
            </section>

            {/* How It Works — Recruiter */}
            <section className="py-12 sm:py-16 md:py-20">
              <h2 className="text-center text-xl sm:text-2xl font-bold text-text">
                Post &rarr; Shortlist &rarr; Hire
              </h2>
              <p className="mt-2 text-center text-sm sm:text-base text-text-muted">Three steps to your next great hire</p>
              <div className="mt-8 sm:mt-10 grid gap-8 sm:gap-6 grid-cols-1 md:grid-cols-3">
                {[
                  { step: "1", title: "Post Your Job", desc: "AI generates job description instantly. Add skills, experience level, and work type.", highlight: "2 minutes" },
                  { step: "2", title: "AI Shortlists Candidates", desc: "Get top 10 candidates ranked by skill match.", highlight: "5-second shortlist" },
                  { step: "3", title: "Reach Out & Hire", desc: "Message candidates and track everything in one place.", highlight: "Built-in messaging" },
                ].map((s) => (
                  <div key={s.step} className="text-center">
                    <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary text-lg sm:text-xl font-bold text-white">
                      {s.step}
                    </div>
                    <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-text">{s.title}</h3>
                    <p className="mt-2 text-sm sm:text-base text-text-muted">{s.desc}</p>
                    <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{s.highlight}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Value Section — Recruiter */}
            <section className="rounded-2xl bg-gray-50 p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text">
                    Everything You Need<br />
                    <span className="text-primary">to Hire Faster</span>
                  </h2>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base text-text-muted">
                    Every tool a recruiter needs, powered by AI. From job posting to offer letter.
                  </p>
                  <ul className="mt-4 sm:mt-6 space-y-3 text-sm">
                    {[
                      ["AI Shortlisting", "Top candidates instantly"],
                      ["Smart Ranking", "See why each candidate fits"],
                      ["Skill Gap Insights", "Know what candidates need before the interview"],
                      ["Built-in Messaging & Pipeline", "Track everything in one place"],
                    ].map(([title, desc]) => (
                      <li key={title} className="flex items-start gap-2">
                        <span className="mt-0.5 text-green-500">&#10003;</span>
                        <div><strong>{title}</strong> &mdash; {desc}</div>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={signupHref}
                    className="mt-5 sm:mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 sm:px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover min-h-[44px] w-full sm:w-auto active:scale-[0.98] transition-transform"
                  >
                    Start Hiring Free &rarr;
                  </Link>
                </div>
                <div className="flex items-center justify-center">
                  <div className="w-full max-w-xs rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-lg">
                    <p className="text-xs font-medium text-text-muted text-center">Find Perfect Candidates &mdash; Instantly</p>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                        <span className="text-xs font-medium text-green-700">Skill Match</span>
                        <span className="text-sm font-bold text-green-700">94%</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                        <span className="text-xs font-medium text-green-700">Experience</span>
                        <span className="text-sm font-bold text-green-700">4+ years</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                        <span className="text-xs font-medium text-green-700">Availability</span>
                        <span className="text-sm font-bold text-green-700">Immediate</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center gap-2">
                      <span className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white">
                        Shortlist All
                      </span>
                      <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-text shadow-sm">
                        Message All
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Pricing — Recruiter */}
            <section className="py-12 sm:py-16 md:py-20 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-text">Simple pricing</h2>
              <p className="mt-2 text-sm sm:text-base text-text-muted">Start free. Upgrade when you need more.</p>
              <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                <div className="rounded-xl border border-gray-200 p-4 sm:p-6 text-left">
                  <p className="font-semibold">Free</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold">₹0</p>
                  <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-text-muted">
                    <li>&#10003; 1 Job Post</li>
                    <li>&#10003; Limited candidates</li>
                    <li>&#10003; Basic shortlist</li>
                  </ul>
                </div>
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 sm:p-6 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-primary">Pro</p>
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold">
                    ₹299<span className="text-sm font-normal text-text-muted">/mo</span>
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Best for growing teams</p>
                  <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-text-muted">
                    <li>&#10003; Unlimited job posts</li>
                    <li>&#10003; AI shortlist (Top 10 instantly)</li>
                    <li>&#10003; Candidate messaging</li>
                    <li>&#10003; Pipeline tracking</li>
                  </ul>
                  <Link
                    href={signupHref}
                    className="mt-4 rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-white hover:bg-primary-hover min-h-[44px] flex items-center justify-center active:scale-[0.98] transition-transform"
                  >
                    Start Free Trial
                  </Link>
                </div>
                <div className="rounded-xl border border-gray-200 p-4 sm:p-6 text-left sm:col-span-2 lg:col-span-1">
                  <p className="font-semibold">Premium</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold">
                    ₹499<span className="text-sm font-normal text-text-muted">/mo</span>
                  </p>
                  <p className="mt-1 text-xs text-text-muted">Hire faster &amp; smarter</p>
                  <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-text-muted">
                    <li>&#10003; Everything in Pro</li>
                    <li>&#10003; Advanced filters</li>
                    <li>&#10003; Hiring predictions</li>
                    <li>&#10003; Team collaboration</li>
                  </ul>
                  <Link
                    href={signupHref}
                    className="mt-4 rounded-lg border border-gray-300 py-2.5 text-center text-sm font-medium text-text hover:bg-gray-50 min-h-[44px] flex items-center justify-center active:scale-[0.98] transition-transform"
                  >
                    Upgrade Now
                  </Link>
                </div>
              </div>
            </section>

            {/* Final CTA — Recruiter */}
            <section className="rounded-2xl bg-primary/5 border border-primary/20 p-6 sm:p-8 md:p-12 text-center mb-12">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-text">
                Stop Screening. Start Hiring.
              </h2>
              <div className="mt-6 flex justify-center">
                <Link
                  href={signupHref}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-primary px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-white shadow-lg hover:bg-primary-hover active:scale-[0.98] transition-transform min-h-[44px]"
                >
                  Start Hiring for Free &rarr;
                </Link>
              </div>
            </section>
          </>
        )}

        {/* ===== SHARED SECTIONS ===== */}

        {/* Data Moat CTAs */}
        <section className="border-t border-gray-100 py-8 sm:py-12">
          <h2 className="text-center text-base sm:text-lg font-semibold text-text">Free Career Intelligence</h2>
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/skills" className="rounded-lg border px-5 py-2.5 text-sm hover:bg-gray-50 text-center min-h-[44px] flex items-center justify-center">
              Top Skills to Get Hired
            </Link>
            <Link href="/salary" className="rounded-lg border px-5 py-2.5 text-sm hover:bg-gray-50 text-center min-h-[44px] flex items-center justify-center">
              Salary Data 2026
            </Link>
            <Link href="/jobs" className="rounded-lg border px-5 py-2.5 text-sm hover:bg-gray-50 text-center min-h-[44px] flex items-center justify-center">
              Browse Jobs
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-text-muted">
            <span>&copy; {new Date().getFullYear()} AI Job Assistant</span>
            <div className="flex gap-4">
              <Link href="/jobs" className="hover:text-text">Jobs</Link>
              <Link href="/skills" className="hover:text-text">Skills</Link>
              <Link href="/salary" className="hover:text-text">Salaries</Link>
              <Link href="/pricing" className="hover:text-text">Pricing</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
