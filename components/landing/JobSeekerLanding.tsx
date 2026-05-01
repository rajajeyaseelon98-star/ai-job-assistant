import Link from "next/link";
import { Check, Quote, FileUp, Wand2, Send } from "lucide-react";
import { HeroResumeCTA } from "./HeroResumeCTA";
import { JobSeekerProofSection } from "./JobSeekerProofSection";
import { LandingTrustPreview } from "./LandingTrustPreview";
import { JOB_SEEKER_SIGNUP } from "./landingPaths";
import { landingContainer, landingSectionY } from "./landingShell";

const signupWithNext = JOB_SEEKER_SIGNUP;

export function JobSeekerLanding() {
  return (
    <>
      <HeroResumeCTA />

      <JobSeekerProofSection />

      <LandingTrustPreview audience="job_seeker" />

      {/* How it works — light */}
      <section className={`bg-background ${landingSectionY}`}>
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">How it works</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted md:text-base">
            Three steps — no guesswork.
          </p>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3 md:gap-12">
            {[
              { step: "1", title: "Upload", sub: "Your resume or create one in 60s", icon: FileUp },
              { step: "2", title: "AI fixes & improves", sub: "ATS-ready for real roles", icon: Wand2 },
              { step: "3", title: "We apply for you", sub: "Daily applications while you focus", icon: Send },
            ].map((s) => (
              <div
                key={s.step}
                className="group flex flex-col items-center text-center transition duration-200 hover:-translate-y-1"
              >
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

      {/* Problem — contrast */}
      <section className={`bg-surface-muted/60 ${landingSectionY}`}>
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            Why 90% of job seekers never get shortlisted
          </h2>
          <ul className="mx-auto mt-10 max-w-xl space-y-4 text-left text-sm text-foreground md:text-base">
            {[
              "Your resume gets rejected by ATS before humans see it",
              "You apply manually → too slow to compete",
              "You don’t know what to fix",
              "You miss high-quality job opportunities",
            ].map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-red-500" aria-hidden>
                  ❌
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-lg font-bold text-primary md:text-xl">We fix all of this automatically.</p>
        </div>
      </section>

      {/* Solution */}
      <section className={`bg-background ${landingSectionY}`}>
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">We apply to jobs for you</h2>
          <ul className="mx-auto mt-10 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
            {[
              "Fix resume instantly",
              "Match best jobs",
              "Apply automatically",
              "Track everything in one place",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                <span className="font-medium text-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Social proof */}
      <section className={`border-y border-border bg-surface-muted/50 ${landingSectionY}`}>
        <div className={`${landingContainer}`}>
          <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">Real results from users</h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8">
            {[
              { quote: "Got 6 interviews in 10 days", name: "Arun", role: "Developer" },
              { quote: "My ATS score improved 52 → 85", name: "Priya", role: "Marketing" },
            ].map((t) => (
              <blockquote
                key={t.name}
                className="relative rounded-2xl border border-border bg-card p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-md"
              >
                <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/10" aria-hidden />
                <p className="text-base font-medium text-foreground md:text-lg">&ldquo;{t.quote}.&rdquo;</p>
                <footer className="mt-4 text-sm text-text-muted">
                  — <span className="font-semibold text-foreground">{t.name}</span>, {t.role}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 3 pillars only */}
      <section className={`bg-background ${landingSectionY}`}>
        <div className={`${landingContainer} text-center`}>
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">Everything you need — in three moves</h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3 md:gap-8">
            {[
              { title: "Fix your resume", line: "AI rewrites for ATS and role fit." },
              { title: "Find best jobs", line: "Matches you to roles you actually qualify for." },
              { title: "Apply automatically", line: "We submit daily — you approve the strategy." },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-border bg-card p-6 text-left shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-md"
              >
                <h3 className="text-lg font-bold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{p.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={`bg-surface-muted/40 ${landingSectionY}`}>
        <div className={`${landingContainer}`}>
          <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl">Pricing</h2>
          <p className="mt-2 text-center text-sm text-text-muted">Cancel anytime · One interview can pay for Pro</p>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3 md:gap-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-md">
              <p className="font-bold text-foreground">Free</p>
              <p className="mt-1 text-3xl font-bold">₹0</p>
              <p className="mt-2 text-sm font-medium text-text-muted">Try the product</p>
              <ul className="mt-4 space-y-2 text-sm text-text-muted">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />1 resume analysis
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Basic ATS score
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Limited matches
                </li>
              </ul>
              <Link
                href={signupWithNext}
                className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-border py-3 text-sm font-bold transition hover:border-primary/40 hover:bg-white"
              >
                Try
              </Link>
            </div>

            <div className="relative rounded-2xl border-2 border-primary bg-card p-6 shadow-card-md md:scale-[1.05]">
              <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow">
                ⭐ Most popular
              </span>
              <p className="font-bold text-primary">Pro</p>
              <p className="mt-1 text-3xl font-bold">
                ₹299<span className="text-base font-normal text-text-muted">/mo</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">Get up to 5× more interviews</p>
              <ul className="mt-4 space-y-2 text-sm text-text-muted">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Unlimited analysis &amp; AI fixes
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Auto apply (100/day)
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Interview boost score
                </li>
              </ul>
              <Link
                href={signupWithNext}
                className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.03] hover:bg-primary-hover hover:shadow-xl"
              >
                Get interviews
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-card-md">
              <p className="font-bold text-foreground">Premium</p>
              <p className="mt-1 text-3xl font-bold">
                ₹499<span className="text-base font-normal text-text-muted">/mo</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">Get priority hiring visibility</p>
              <ul className="mt-4 space-y-2 text-sm text-text-muted">
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Everything in Pro
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Priority applications
                </li>
                <li className="flex gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  Profile boost &amp; salary insights
                </li>
              </ul>
              <Link
                href={signupWithNext}
                className="mt-6 flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-primary py-3 text-sm font-bold text-primary transition hover:bg-primary/5"
              >
                Get hired faster
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`${landingSectionY}`}>
        <div className="mx-4 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 shadow-xl md:mx-auto md:max-w-[1200px]">
          <div className="px-6 py-14 text-center md:px-12 md:py-16">
            <h2 className="text-2xl font-bold text-white md:text-4xl">Get Your First Interview This Week</h2>
            <p className="mx-auto mt-3 max-w-lg text-base text-blue-100 md:text-lg">
              Instant results · Takes 30 seconds · We get you interviews automatically
            </p>
            <Link
              href={signupWithNext}
              className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-10 py-3.5 text-base font-bold text-slate-900 shadow-xl transition hover:scale-[1.03] hover:shadow-2xl active:scale-[0.98]"
            >
              Upload Resume &amp; Start →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
