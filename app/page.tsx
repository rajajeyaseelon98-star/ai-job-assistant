"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { JobSeekerLanding } from "@/components/landing/JobSeekerLanding";
import { RecruiterLanding } from "@/components/landing/RecruiterLanding";
import { LandingRoleToggle } from "@/components/landing/LandingRoleToggle";
import { LANDING_ROLE_STORAGE_KEY, type LandingRole } from "@/components/landing/landingTypes";
import { JOB_SEEKER_SIGNUP, RECRUITER_SIGNUP } from "@/components/landing/landingPaths";

export default function LandingPage() {
  const [role, setRoleState] = useState<LandingRole>("job_seeker");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANDING_ROLE_STORAGE_KEY) as LandingRole | null;
      if (saved === "recruiter" || saved === "job_seeker") {
        setRoleState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setRole = useCallback((r: LandingRole) => {
    setRoleState(r);
    try {
      localStorage.setItem(LANDING_ROLE_STORAGE_KEY, r);
    } catch {
      /* ignore */
    }
  }, []);

  const signupHref = role === "job_seeker" ? JOB_SEEKER_SIGNUP : RECRUITER_SIGNUP;

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="sticky top-0 z-50 min-h-[64px] border-b border-border bg-white/80 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-6 py-3 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <span className="text-lg font-semibold text-primary sm:text-xl">AI Job Assistant</span>
            <nav className="hidden items-center gap-6 sm:flex">
              <Link href="/jobs" className="text-sm text-text-muted transition hover:text-foreground">
                Jobs
              </Link>
              <Link href="/pricing" className="text-sm text-text-muted transition hover:text-foreground">
                Pricing
              </Link>
              <Link href="/login" className="text-sm text-text-muted transition hover:text-foreground">
                Login
              </Link>
              <Link
                href={signupHref}
                className="inline-flex min-h-[48px] items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.03] hover:bg-primary-hover hover:shadow-lg"
              >
                Get Started
              </Link>
            </nav>
            <div className="flex items-center gap-2 sm:hidden">
              <Link href="/login" className="text-sm text-text-muted">
                Login
              </Link>
              <Link
                href={signupHref}
                className="inline-flex min-h-[44px] items-center rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white"
              >
                Start
              </Link>
            </div>
          </div>
          <div className="flex justify-center pb-1">
            <LandingRoleToggle role={role} onRoleChange={setRole} />
          </div>
        </div>
        <div className="flex justify-center gap-6 border-t border-border/60 px-4 py-2 sm:hidden">
          <Link href="/jobs" className="text-xs text-text-muted">
            Jobs
          </Link>
          <Link href="/pricing" className="text-xs text-text-muted">
            Pricing
          </Link>
        </div>
      </header>

      {/* Slide between journeys — 250ms ease-in-out */}
      <div className="mx-auto w-full max-w-[1200px] overflow-hidden px-0">
        <div
          className={`flex w-[200%] transition-transform duration-[250ms] ease-in-out ${
            role === "job_seeker" ? "translate-x-0" : "-translate-x-1/2"
          }`}
        >
          <div className="w-1/2 shrink-0 min-w-0">
            <JobSeekerLanding />
          </div>
          <div className="w-1/2 shrink-0 min-w-0">
            <RecruiterLanding />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-6 py-12 lg:px-8">
        <section className="border-t border-border pt-12">
          <h2 className="text-center text-base font-semibold text-foreground sm:text-lg">Free career intelligence</h2>
          <div className="mt-4 flex flex-col flex-wrap justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/skills"
              className="flex min-h-[48px] items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
            >
              Top skills to get hired
            </Link>
            <Link
              href="/salary"
              className="flex min-h-[48px] items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
            >
              Salary data 2026
            </Link>
            <Link
              href="/jobs"
              className="flex min-h-[48px] items-center justify-center rounded-xl border border-border px-5 py-2.5 text-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card"
            >
              Browse jobs
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <p className="mb-4 text-center text-xs text-text-muted sm:text-left">
            Your data is secure — encrypted in transit and at rest.
          </p>
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row text-xs sm:text-sm text-text-muted">
            <span className="font-semibold text-foreground">&copy; {new Date().getFullYear()} AI Job Assistant</span>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              <Link href="/jobs" className="transition hover:text-foreground">
                Jobs
              </Link>
              <Link href="/skills" className="transition hover:text-foreground">
                Skills
              </Link>
              <Link href="/salary" className="transition hover:text-foreground">
                Salaries
              </Link>
              <Link href="/pricing" className="transition hover:text-foreground">
                Pricing
              </Link>
              <Link href="/privacy" className="transition hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="transition hover:text-foreground">
                Terms
              </Link>
              <Link href="/contact" className="transition hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
