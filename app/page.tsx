"use client";

/**
 * AI Job Assistant — premium marketing landing (App Router).
 * Tab state drives copy, bento visuals, metrics, pricing, and signup CTAs.
 */

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  FileText,
  Sparkles,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { FREE_PLAN_LIMITS } from "@/lib/usage-limits";

type ActiveTab = "job_seeker" | "recruiter";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const view = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

/** Custom SVG checkmark for pricing rows */
function PricingCheck({ className = "h-5 w-5 shrink-0 text-primary" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" className="fill-surface-muted" />
      <path
        d="M6 10.2 8.4 12.6 14 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("job_seeker");
  const signupHref = `/signup?role=${activeTab}`;

  return (
    <div className="min-h-screen bg-background font-sans text-text antialiased">
      {/* ── 1. Navbar — glass, sticky ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/70 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight text-text">
            AI Job Assistant
          </Link>

          {/* Center: iOS-style segmented control */}
          <div className="order-3 flex justify-center sm:order-none sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            <div
              className="inline-flex rounded-full bg-surface-muted/80 p-1 shadow-inner ring-1 ring-border"
              role="tablist"
              aria-label="Audience"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "job_seeker"}
                onClick={() => setActiveTab("job_seeker")}
                className={`relative min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 sm:min-w-[160px] sm:px-5 ${
                  activeTab === "job_seeker"
                    ? "bg-card text-text shadow-md ring-1 ring-border"
                    : "text-text-muted hover:text-text"
                }`}
              >
                For Job Seekers
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "recruiter"}
                onClick={() => setActiveTab("recruiter")}
                className={`relative min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 sm:min-w-[160px] sm:px-5 ${
                  activeTab === "recruiter"
                    ? "bg-card text-text shadow-md ring-1 ring-border"
                    : "text-text-muted hover:text-text"
                }`}
              >
                For Recruiters
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <Link
              href="/login"
              className="min-h-[44px] rounded-full px-4 py-2 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text"
            >
              Login
            </Link>
            <Link
              href={signupHref}
              className="inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition hover:bg-primary-hover"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
        >
          {/* ── 2. Hero — dark slate + radial glow + bento ── */}
          <section className="relative overflow-visible bg-foreground px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
            {/* Soft primary radial glow */}
            <div
              className="pointer-events-none absolute -left-1/4 top-0 h-[500px] w-[800px] rounded-full bg-primary/15 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-blue-500/10 blur-3xl"
              aria-hidden
            />

            <div className="relative mx-auto max-w-6xl">
              <div className="mx-auto max-w-3xl text-center">
                <AnimatePresence mode="wait">
                  {activeTab === "job_seeker" ? (
                    <motion.div
                      key="js-hero"
                      {...fade}
                      transition={{ duration: 0.35 }}
                      className="space-y-5"
                    >
                      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Apply smarter with AI-assisted tools.
                      </h1>
                      <p className="text-lg leading-relaxed text-slate-300 sm:text-xl">
                        Score your resume, tailor it for roles, discover matches, and use automation where it fits your
                        workflow — built to save time on repetitive work.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="rec-hero"
                      {...fade}
                      transition={{ duration: 0.35 }}
                      className="space-y-5"
                    >
                      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Find strong candidates faster.
                      </h1>
                      <p className="text-lg leading-relaxed text-slate-300 sm:text-xl">
                        Post roles, shortlist from job seeker profiles, and message candidates — with AI to draft and rank
                        so your team spends less time on manual triage.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-10 flex justify-center sm:mt-12">
                <Link
                  href={signupHref}
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-[0_0_40px_-10px_rgba(37,99,235,0.35)] transition hover:scale-[1.02] hover:bg-primary-hover"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              {/* Bento grid — overlaps trust banner; glass + strong contrast */}
              <div className="relative z-10 mt-12 -mb-24 grid gap-4 sm:mt-14 sm:grid-cols-3 lg:mt-16 lg:gap-6">
                {activeTab === "job_seeker" ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="rounded-2xl border border-white/10 border-t-white/20 bg-slate-800 p-6 shadow-2xl shadow-slate-900/20"
                    >
                      <div className="flex items-center gap-2 text-slate-200">
                        <BarChart3 className="h-5 w-5 shrink-0 text-indigo-300" strokeWidth={2} />
                        <span className="text-xs font-semibold uppercase tracking-wide">ATS</span>
                      </div>
                      <p className="mt-4 text-3xl font-bold tabular-nums text-white">Sample</p>
                      <p className="mt-1 text-sm font-medium text-slate-200">ATS-style score (illustrative)</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-2xl border border-white/10 border-t-white/20 bg-slate-800 p-6 shadow-2xl shadow-slate-900/20"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                        Readiness signal
                      </p>
                      <p className="mt-3 text-2xl font-bold text-emerald-300">Strong</p>
                      <div className="mt-4 space-y-2">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-700/80">
                          <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400" />
                        </div>
                        <div className="flex justify-between text-xs font-medium text-slate-200">
                          <span>Skill match</span>
                          <span>Experience</span>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="rounded-2xl border border-white/10 border-t-white/20 bg-slate-800 p-6 shadow-2xl shadow-slate-900/20"
                    >
                      <div className="flex items-center gap-2 text-indigo-200">
                        <Zap className="h-5 w-5 shrink-0 text-indigo-300" strokeWidth={2} />
                        <span className="text-sm font-semibold text-white">Smart Auto-Apply</span>
                      </div>
                      <p className="mt-4 inline-flex rounded-full bg-emerald-500/25 px-3 py-1 text-sm font-semibold text-emerald-200">
                        Active
                      </p>
                      <p className="mt-3 text-xs font-medium text-slate-200">Daily applications on your behalf</p>
                    </motion.div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className="rounded-2xl border border-white/10 border-t-white/20 bg-slate-800 p-6 shadow-2xl shadow-slate-900/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/40 text-sm font-bold text-white ring-1 ring-white/20">
                          JS
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-200">Candidate Match</p>
                          <p className="text-xl font-bold text-white">Demo</p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs font-medium text-slate-200">Illustrative profile card</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-2xl border border-white/10 border-t-white/20 bg-slate-800 p-6 shadow-2xl shadow-slate-900/20"
                    >
                      <Sparkles className="h-6 w-6 text-indigo-300" strokeWidth={2} />
                      <p className="mt-3 text-lg font-semibold text-white">Shortlist preview</p>
                      <p className="mt-2 text-sm font-medium text-slate-200">Ranked suggestions (example)</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="rounded-2xl border border-white/10 border-t-white/20 bg-slate-800 p-6 shadow-2xl shadow-slate-900/20"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                        Skill Overlap
                      </p>
                      <p className="mt-3 text-sm font-medium leading-relaxed text-white">
                        React, Node, AWS <span className="text-emerald-300">(Matched)</span>
                      </p>
                    </motion.div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* ── 3. Trust banner ── */}
          <motion.section {...view} className="border-y border-slate-200/80 bg-white pt-32 pb-12">
            <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
              <p className="text-sm font-medium text-slate-500">
                Built for job seekers and hiring teams who want less busywork
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-50 grayscale">
                {["Nexus", "Vertex", "Pulse", "Apex", "Orbit", "Stride"].map((name) => (
                  <span key={name} className="text-lg font-bold tracking-tight text-slate-400">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </motion.section>

          {/* ── 4. Why — comparison ── */}
          <motion.section {...view} className="bg-slate-50 py-24 md:py-32">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Why teams switch to AI Job Assistant
              </h2>
              <div className="mt-12 grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-100 p-8 shadow-inner">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">The old way</p>
                  <ul className="mt-6 space-y-4 text-slate-600">
                    {activeTab === "job_seeker" ? (
                      <>
                        <li className="flex gap-3">
                          <span className="text-slate-400">—</span>
                          Endless manual data entry
                        </li>
                        <li className="flex gap-3">
                          <span className="text-slate-400">—</span>
                          Guessing what the ATS wants
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex gap-3">
                          <span className="text-slate-400">—</span>
                          Reading 100s of generic resumes
                        </li>
                        <li className="flex gap-3">
                          <span className="text-slate-400">—</span>
                          Manual keyword searching
                        </li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="relative rounded-2xl border border-indigo-200/60 bg-white p-8 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/10">
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-indigo-500/[0.03]" />
                  <p className="relative text-xs font-semibold uppercase tracking-wide text-indigo-600">
                    The AI way
                  </p>
                  <ul className="relative mt-6 space-y-4 font-medium text-slate-800">
                    {activeTab === "job_seeker" ? (
                      <>
                        <li className="flex gap-3">
                          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                          AI Auto-Applies for you
                        </li>
                        <li className="flex gap-3">
                          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                          Dynamically tailored resumes
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex gap-3">
                          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                          Faster resume and keyword alignment
                        </li>
                        <li className="flex gap-3">
                          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                          AI candidate screening and ranking
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── 5. How it works — 3 steps ── */}
          <motion.section {...view} className="bg-white py-24 md:py-32">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                How it works
              </h2>
              <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
                {activeTab === "job_seeker" ? (
                  <>
                    <StepCard
                      step={1}
                      title="Upload & Score"
                      desc="See exact ATS gaps before you apply."
                      icon={<Upload className="h-8 w-8 text-indigo-600" strokeWidth={2} />}
                    />
                    <StepCard
                      step={2}
                      title="AI Improvement"
                      desc="Tailor your resume instantly for each role."
                      icon={<Sparkles className="h-8 w-8 text-indigo-600" strokeWidth={2} />}
                    />
                    <StepCard
                      step={3}
                      title="Smart Auto-Apply"
                      desc="Set rules — we apply daily on your behalf."
                      icon={<Zap className="h-8 w-8 text-indigo-600" strokeWidth={2} />}
                    />
                  </>
                ) : (
                  <>
                    <StepCard
                      step={1}
                      title="Post Job"
                      desc="AI writes the description from your brief."
                      icon={<FileText className="h-8 w-8 text-indigo-600" strokeWidth={2} />}
                    />
                    <StepCard
                      step={2}
                      title="Shortlist"
                      desc="Review ranked candidates from your pipeline."
                      icon={<Users className="h-8 w-8 text-indigo-600" strokeWidth={2} />}
                    />
                    <StepCard
                      step={3}
                      title="Reach Out"
                      desc="1-click push notifications to candidates."
                      icon={<Bell className="h-8 w-8 text-indigo-600" strokeWidth={2} />}
                    />
                  </>
                )}
              </div>
            </div>
          </motion.section>

          {/* ── 6. Metrics grid ── */}
          <motion.section {...view} className="border-y border-slate-200/80 bg-slate-50 py-24 md:py-32">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-6 sm:grid-cols-3">
                {activeTab === "job_seeker" ? (
                  <>
                    <MetricCard label="Time saved" value="Hours/wk" hint="less manual formatting" />
                    <MetricCard label="ATS-style feedback" value="Actionable" hint="gap-focused suggestions" />
                    <MetricCard label="Applications" value="Scalable" hint="rules-based auto-apply (limits apply)" />
                  </>
                ) : (
                  <>
                    <MetricCard label="Triage" value="Faster" hint="ranked views for your pipeline" />
                    <MetricCard label="Fit signals" value="Transparent" hint="skills & preferences" />
                    <MetricCard label="Coordination" value="In-app" hint="messaging & notifications" />
                  </>
                )}
              </div>
            </div>
          </motion.section>

          {/* ── 7. Pricing ── */}
          <motion.section {...view} className="bg-white py-24 md:py-32">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-center text-slate-500">
                Cancel anytime. Upgrade when you see results.
              </p>
              <div className="mt-14 grid gap-8 lg:grid-cols-3 lg:items-stretch">
                {activeTab === "job_seeker" ? (
                  <>
                    <PricingCard
                      name="Free"
                      price="₹0"
                      period=""
                      features={[
                        `${FREE_PLAN_LIMITS.resume_analysis} resume analyses / month`,
                        "ATS-style score & feedback",
                        `${FREE_PLAN_LIMITS.job_match} job matches / month`,
                      ]}
                      cta="Start free"
                      href={signupHref}
                      highlight={false}
                    />
                    <PricingCard
                      name="Pro"
                      price="₹299"
                      period="/mo"
                      features={[
                        "Unlimited resume scans",
                        "AI resume improvements",
                        "Smart Auto-Apply (rule-based daily limits)",
                        "Interview readiness signals",
                      ]}
                      cta="Start free trial"
                      href={signupHref}
                      highlight
                    />
                    <PricingCard
                      name="Premium"
                      price="₹499"
                      period="/mo"
                      features={[
                        "Everything in Pro",
                        "Profile boost",
                        "Priority applications",
                        "Salary insights",
                      ]}
                      cta="Get Premium"
                      href={signupHref}
                      highlight={false}
                    />
                  </>
                ) : (
                  <>
                    <PricingCard
                      name="Free"
                      price="₹0"
                      period=" to start"
                      features={["1 job post", "Basic shortlist", "Limited pipeline"]}
                      cta="Start free"
                      href={signupHref}
                      highlight={false}
                    />
                    <PricingCard
                      name="Pro"
                      price="₹299"
                      period="/mo"
                      features={[
                        "Unlimited job posts",
                        "Instant shortlist",
                        "Candidate messaging",
                        "ATS pipeline",
                      ]}
                      cta="Start free trial"
                      href={signupHref}
                      highlight
                    />
                    <PricingCard
                      name="Premium"
                      price="₹499"
                      period="/mo"
                      features={[
                        "Everything in Pro",
                        "Advanced filters",
                        "Team collaboration",
                        "Hiring analytics",
                      ]}
                      cta="Get Premium"
                      href={signupHref}
                      highlight={false}
                    />
                  </>
                )}
              </div>
            </div>
          </motion.section>

          {/* ── 8. Bottom CTA ── */}
          <section className="relative overflow-hidden bg-slate-900 px-4 py-20 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-indigo-500/10 blur-3xl" aria-hidden />
            <div className="relative mx-auto max-w-3xl text-center">
              <AnimatePresence mode="wait">
                {activeTab === "job_seeker" ? (
                  <motion.div
                    key="js-cta"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      Ready to tighten your applications?
                    </h2>
                    <Link
                      href={signupHref}
                      className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-indigo-600 px-10 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.45)] transition hover:bg-indigo-500"
                    >
                      Create your free account
                    </Link>
                  </motion.div>
                ) : (
                  <motion.div
                    key="rec-cta"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                      Ready to streamline hiring workflows?
                    </h2>
                    <Link
                      href={signupHref}
                      className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-indigo-600 px-10 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.45)] transition hover:bg-indigo-500"
                    >
                      Create your free account
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <span className="font-medium text-slate-700">© {new Date().getFullYear()} AI Job Assistant</span>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-slate-900">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  title,
  desc,
  icon,
}: {
  step: number;
  title: string;
  desc: string;
  icon: ReactNode;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 shadow-inner">
        {icon}
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-indigo-600">Step {step}</p>
      <h3 className="mt-2 text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">
      <p className="text-4xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 font-semibold text-slate-800">{label}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  href,
  highlight,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  highlight: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 ${
        highlight
          ? "z-10 scale-105 border-indigo-500 bg-white pt-8 shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500/20"
          : "border-slate-200 bg-slate-50/80 shadow-xl shadow-slate-200/50"
      }`}
    >
      {highlight && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
          Most popular
        </span>
      )}
      <p className="text-lg font-bold text-slate-900">{name}</p>
      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight text-slate-900">{price}</span>
        <span className="text-slate-500">{period}</span>
      </p>
      <ul className="mt-8 flex-1 space-y-4">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm text-slate-700">
            <PricingCheck />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-10 inline-flex min-h-[48px] w-full items-center justify-center rounded-full text-center text-sm font-semibold transition ${
          highlight
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500"
            : "border border-slate-200 bg-white text-slate-900 hover:border-indigo-300 hover:bg-indigo-50"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
