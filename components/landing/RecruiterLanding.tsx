import Link from "next/link";
import {
  Check,
  Quote,
  FileText,
  Users,
  MessageSquare,
  Briefcase,
  Zap,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { RECRUITER_SIGNUP } from "./landingPaths";
import { LandingTrustPreview } from "./LandingTrustPreview";
import { landingContainer, landingSectionY } from "./landingShell";

const signupHref = RECRUITER_SIGNUP;

function RecruiterHeroDark() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-slate-950 to-black text-white">
      <div className={`${landingContainer} py-14 md:py-20`}>
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.15em] text-blue-200/90">
          AI shortlists — you hire faster
        </p>
        <h1 className="text-balance text-center text-3xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
          Stop Screening Resumes.
          <span className="mt-2 block bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Start Hiring Faster.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-center text-base text-slate-300 md:text-lg">
          AI finds, ranks, and shortlists the best candidates instantly.
        </p>

        {/* Proof first */}
        <div className="mx-auto mb-10 mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
          {[
            { icon: Users, label: "Candidates found", value: "52", hint: "in your pipeline" },
            { icon: UserCheck, label: "Top shortlisted", value: "5", hint: "best match first" },
            { icon: TrendingUp, label: "Match score", value: "94%", hint: "skill fit" },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-left backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <m.icon className="h-5 w-5 text-blue-200" aria-hidden />
              <p className="mt-2 text-2xl font-bold tabular-nums">{m.value}</p>
              <p className="text-xs font-medium text-slate-300">{m.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{m.hint}</p>
            </div>
          ))}
        </div>

        <p className="mb-8 text-center text-xs text-slate-400">Instant results · Takes 30 seconds · No credit card</p>

        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-2xl">💼</span>
              <div>
                <p className="text-sm font-bold">Post Your Job</p>
                <p className="text-xs text-slate-400">Example — edit after signup</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Role</dt>
                <dd className="font-medium">Frontend Developer</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Skills</dt>
                <dd className="font-medium">React, Node</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-400">Experience</dt>
                <dd className="font-medium">2–4 years</dd>
              </div>
            </dl>
            <p className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-300">
              <Zap className="h-4 w-4 shrink-0" aria-hidden />
              AI will shortlist candidates instantly
            </p>
            <Link
              href={signupHref}
              className="mt-6 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-bold text-slate-900 shadow-xl transition hover:scale-[1.03] active:scale-[0.99]"
            >
              <Briefcase className="h-5 w-5" />
              Start Hiring Free →
            </Link>
          </div>
          <p className="mt-5 text-center text-xs text-slate-400">Used by startups &amp; recruiters · Hiring speed</p>
        </div>
      </div>
    </section>
  );
}

export function RecruiterLanding() {
  return (
    <>
      <RecruiterHeroDark />

      {/* Proof strip — 3 cards */}
      <section className={`border-y border-border bg-background ${landingSectionY}`}>
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">See what you&apos;ll get instantly</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted">
            Three signals — before you read a single resume.
          </p>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3 md:gap-8">
            {[
              { label: "Shortlist quality", value: "Top 8", sub: "ranked by fit" },
              { label: "Skill match", value: "94%", sub: "avg. for top 5" },
              { label: "Time saved", value: "Hours", sub: "vs manual screening" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-border bg-card p-6 text-left shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{c.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{c.value}</p>
                <p className="mt-1 text-sm text-text-muted">{c.sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-text-muted">&ldquo;This is exactly what recruiters see&rdquo;</p>
        </div>
      </section>

      <LandingTrustPreview audience="recruiter" />

      <section className={`bg-background ${landingSectionY}`}>
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">How it works</h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3 md:gap-12">
            {[
              { step: "1", title: "Post job", sub: "AI helps with description & reqs", icon: FileText },
              { step: "2", title: "AI shortlists", sub: "Ranked by skill match", icon: Users },
              { step: "3", title: "Message & hire", sub: "One pipeline, one inbox", icon: MessageSquare },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary md:h-14 md:w-14">
                  <s.icon className="h-7 w-7 md:h-8 md:w-8" strokeWidth={1.75} aria-hidden />
                </div>
                <span className="mt-4 text-xs font-bold text-primary">Step {s.step}</span>
                <h3 className="mt-1 text-lg font-bold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`bg-slate-50 ${landingSectionY}`}>
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Why hiring feels broken</h2>
          <ul className="mx-auto mt-10 max-w-xl space-y-4 text-left text-sm md:text-base">
            {[
              "Too many irrelevant applications",
              "Wasting hours screening resumes",
              "Missing good candidates",
              "Hiring takes weeks",
            ].map((line) => (
              <li key={line} className="flex gap-3 text-foreground">
                <span className="text-red-500" aria-hidden>
                  ❌
                </span>
                {line}
              </li>
            ))}
          </ul>
          <p className="mt-10 text-lg font-bold text-primary">We fix all of this automatically.</p>
        </div>
      </section>

      <section className={`bg-background ${landingSectionY}`}>
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-2xl font-bold md:text-3xl">
            We don&apos;t just show candidates.
            <span className="mt-1 block text-primary">We find the best ones for you.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-text-muted md:text-base">
            Shortlists, scores, and messaging — spend time on conversations, not inbox zero.
          </p>
        </div>
      </section>

      <section className={`border-y border-border bg-surface-muted/40 ${landingSectionY}`}>
        <div className={`${landingContainer}`}>
          <h2 className="text-center text-2xl font-bold md:text-3xl">Real results from recruiters</h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              { quote: "Hired 3 developers in 5 days", name: "Rahul", role: "HR Lead" },
              { quote: "Saved hours of screening", name: "Sneha", role: "Talent Partner" },
            ].map((t) => (
              <blockquote
                key={t.name}
                className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-md"
              >
                <Quote className="mb-3 h-8 w-8 text-primary/15" aria-hidden />
                <p className="font-medium text-foreground">&ldquo;{t.quote}.&rdquo;</p>
                <footer className="mt-4 text-sm text-text-muted">
                  — <span className="font-semibold text-foreground">{t.name}</span>, {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 3 pillars */}
      <section className={`bg-background ${landingSectionY}`}>
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-2xl font-bold md:text-3xl">Built for hiring speed</h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3 md:gap-8">
            {[
              { title: "Find candidates", line: "Search + AI match across your criteria." },
              { title: "Rank & shortlist", line: "Top fits first — with clear scores." },
              { title: "Contact instantly", line: "Message from one pipeline." },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-border bg-card p-6 text-left shadow-card transition hover:-translate-y-1 hover:shadow-card-md"
              >
                <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{p.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={`bg-slate-50/50 ${landingSectionY}`}>
        <div className={`${landingContainer}`}>
          <h2 className="text-center text-2xl font-bold md:text-3xl">Pricing</h2>
          <p className="mt-2 text-center text-sm text-text-muted">Focus → hiring speed</p>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3 md:gap-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1">
              <p className="font-bold">Free</p>
              <p className="mt-1 text-3xl font-bold">₹0</p>
              <p className="mt-2 text-sm font-medium text-text-muted">Try hiring workflow</p>
              <ul className="mt-4 space-y-2 text-sm text-text-muted">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />1 job post
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Basic shortlist
                </li>
              </ul>
              <Link
                href={signupHref}
                className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-border py-3 text-sm font-bold hover:bg-white"
              >
                Try
              </Link>
            </div>

            <div className="relative rounded-2xl border-2 border-primary bg-card p-6 shadow-card-md md:scale-[1.05]">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                ⭐ Most popular
              </span>
              <p className="font-bold text-primary">Pro</p>
              <p className="mt-1 text-3xl font-bold">
                ₹499<span className="text-base font-normal text-text-muted">/mo</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">Fill roles 3× faster</p>
              <ul className="mt-4 space-y-2 text-sm text-text-muted">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Unlimited posts &amp; AI shortlist
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Messaging &amp; pipeline
                </li>
              </ul>
              <Link
                href={signupHref}
                className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg hover:scale-[1.03] hover:bg-primary-hover"
              >
                Start free trial
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1">
              <p className="font-bold">Premium</p>
              <p className="mt-1 text-3xl font-bold">
                ₹999<span className="text-base font-normal text-text-muted">/mo</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">Priority hiring visibility</p>
              <ul className="mt-4 space-y-2 text-sm text-text-muted">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Everything in Pro
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Team &amp; analytics
                </li>
              </ul>
              <Link
                href={signupHref}
                className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-primary py-3 text-sm font-bold text-primary hover:bg-primary/5"
              >
                Get Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className={`${landingSectionY}`}>
        <div className="mx-4 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl md:mx-auto md:max-w-[1200px]">
          <div className="px-6 py-14 text-center md:px-12 md:py-16">
            <h2 className="text-2xl font-bold text-white md:text-4xl">Hire Your First Candidate Today</h2>
            <p className="mx-auto mt-3 max-w-lg text-blue-100 md:text-lg">
              Instant shortlist · Takes 30 seconds to start · AI finds your best fits
            </p>
            <Link
              href={signupHref}
              className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-10 py-3.5 text-base font-bold text-slate-900 shadow-xl transition hover:scale-[1.03]"
            >
              Post a Job →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
