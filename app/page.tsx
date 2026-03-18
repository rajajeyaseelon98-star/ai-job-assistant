import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="border-b border-gray-200 bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <span className="text-lg sm:text-xl font-semibold text-primary">
            AI Job Assistant
          </span>
          <nav className="hidden sm:flex items-center gap-4">
            <Link href="/jobs" className="text-text-muted hover:text-text text-sm sm:text-base">
              Jobs
            </Link>
            <Link href="/skills" className="text-text-muted hover:text-text text-sm sm:text-base">
              Skills
            </Link>
            <Link href="/salary" className="text-text-muted hover:text-text text-sm sm:text-base">
              Salaries
            </Link>
            <Link href="/login" className="text-text-muted hover:text-text text-sm sm:text-base">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-hover text-sm sm:text-base min-h-[44px] inline-flex items-center"
            >
              Get Started Free
            </Link>
          </nav>
          {/* Mobile nav */}
          <div className="flex sm:hidden items-center gap-3">
            <Link href="/login" className="text-text-muted hover:text-text text-sm">
              Log in
            </Link>
            <Link
              href="/signup"
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
          <Link href="/skills" className="text-text-muted hover:text-text text-sm">
            Skills
          </Link>
          <Link href="/salary" className="text-text-muted hover:text-text text-sm">
            Salaries
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero — ONE clear hook */}
        <section className="py-12 sm:py-16 md:py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="mb-4 inline-block rounded-full bg-green-100 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-green-700">
              Join 10,000+ candidates getting more interviews
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-text">
              Get 3x More Interviews<br />
              <span className="text-primary">Using AI</span>
            </h1>
            <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-sm sm:text-base lg:text-lg text-text-muted">
              Upload your resume. Our AI finds the best jobs, tailors your resume for each one,
              and applies automatically. You just show up for interviews.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-primary px-6 sm:px-8 py-3 sm:py-3.5 text-base sm:text-lg font-semibold text-white shadow-lg hover:bg-primary-hover active:scale-[0.98] transition-transform min-h-[44px]"
              >
                Increase My Interview Chances →
              </Link>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-text-muted">
              Free to start · No credit card required
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
              <span className="block text-xl sm:text-2xl font-bold text-text">5 sec</span>
              To shortlist candidates
            </div>
            <div className="hidden sm:block h-8 w-px bg-gray-200" />
            <div>
              <span className="block text-xl sm:text-2xl font-bold text-text">₹0</span>
              To get started
            </div>
          </div>
        </section>

        {/* How It Works — Simple 3 steps */}
        <section className="py-12 sm:py-16 md:py-20">
          <h2 className="text-center text-xl sm:text-2xl font-bold text-text">
            3 Steps to More Interviews
          </h2>
          <div className="mt-8 sm:mt-10 grid gap-8 sm:gap-6 grid-cols-1 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Upload Your Resume",
                desc: "Get instant ATS score + AI tells you exactly what to fix. 90% of resumes fail ATS — yours won't.",
                highlight: "Takes 30 seconds",
              },
              {
                step: "2",
                title: "AI Finds & Applies",
                desc: "Our AI searches thousands of jobs, tailors your resume for each, and auto-applies. You sleep, it works.",
                highlight: "Set it and forget it",
              },
              {
                step: "3",
                title: "Track & Optimize",
                desc: "See which resume version gets the most interviews. AI Career Coach tells you exactly what to improve.",
                highlight: "Data-driven decisions",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary text-lg sm:text-xl font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-text">{s.title}</h3>
                <p className="mt-2 text-sm sm:text-base text-text-muted">{s.desc}</p>
                <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {s.highlight}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Core Feature — Interview Intelligence */}
        <section className="rounded-2xl bg-gray-50 p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-text">
                Know Your Interview Chances<br />
                <span className="text-primary">Before You Apply</span>
              </h2>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-text-muted">
                For every job, our AI tells you your exact interview probability —
                and what to do to increase it.
              </p>
              <ul className="mt-4 sm:mt-6 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-500">✓</span>
                  <div>
                    <strong>Interview Probability Score</strong> — Real-time prediction per job
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-500">✓</span>
                  <div>
                    <strong>AI Career Coach</strong> — &quot;You&apos;re failing because...&quot; with specific fixes
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-500">✓</span>
                  <div>
                    <strong>Resume Performance Index</strong> — Which version gets the most interviews
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-500">✓</span>
                  <div>
                    <strong>Score Transparency</strong> — See exactly why each score is what it is
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-500">✓</span>
                  <div>
                    <strong>Skill ROI Ranking</strong> — Which skills to learn for max interview chances
                  </div>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-lg">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-green-500">78%</div>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-text">Interview Probability</p>
                </div>
                <div className="mt-3 sm:mt-4 space-y-2 text-xs text-text-muted">
                  <div className="flex justify-between">
                    <span>Skill Match</span>
                    <span className="font-medium text-green-600">85%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Experience Fit</span>
                    <span className="font-medium text-green-600">70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resume Quality</span>
                    <span className="font-medium text-yellow-600">65%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>History</span>
                    <span className="font-medium text-green-600">80%</span>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 rounded-lg bg-green-50 p-2 text-center text-[11px] text-green-700">
                  Why this score? Skill match (35%) + Experience (25%) + Resume (20%) + History (20%)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Streak & Rewards */}
        <section className="py-12 sm:py-16 md:py-20">
          <h2 className="text-center text-xl sm:text-2xl font-bold text-text">Stay Consistent. Get Rewarded.</h2>
          <p className="mt-2 text-center text-sm sm:text-base text-text-muted">
            Maintain your daily streak and earn real rewards — not just badges.
          </p>
          <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { days: "7 days", reward: "1 Free Auto-Apply", emoji: "🎯" },
              { days: "14 days", reward: "3-Day Profile Boost", emoji: "⚡" },
              { days: "30 days", reward: "7-Day Boost + 3 Auto-Applies", emoji: "🚀" },
              { days: "100 days", reward: "Permanent 1.5x Visibility", emoji: "🏆" },
            ].map((r) => (
              <div key={r.days} className="rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-5 text-center">
                <div className="text-2xl sm:text-3xl">{r.emoji}</div>
                <div className="mt-1 sm:mt-2 text-sm sm:text-base font-bold text-text">{r.days}</div>
                <div className="mt-1 text-xs sm:text-sm text-primary">{r.reward}</div>
              </div>
            ))}
          </div>
        </section>

        {/* For Recruiters */}
        <section className="rounded-2xl border border-gray-200 bg-card p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
            <div>
              <span className="text-xs sm:text-sm font-medium text-primary">FOR RECRUITERS</span>
              <h2 className="mt-2 text-xl sm:text-2xl font-bold text-text">
                Top 10 Candidates<br />
                Ready in 5 Seconds
              </h2>
              <p className="mt-3 text-sm sm:text-base text-text-muted">
                Post a job → Instant AI shortlist → One-click outreach.
                No more hours of screening.
              </p>
              <ul className="mt-4 space-y-2 text-xs sm:text-sm text-text-muted">
                <li>⚡ Instant Shortlist Mode — candidates matched by skill graph</li>
                <li>📊 Smart ranking with transparency (see exactly why)</li>
                <li>📬 One-click message to all shortlisted candidates</li>
                <li>🎯 Hiring success prediction model</li>
                <li>💰 Salary intelligence &amp; market data</li>
              </ul>
              <Link
                href="/signup"
                className="mt-5 sm:mt-6 inline-flex items-center justify-center rounded-lg border border-primary px-5 sm:px-6 py-2 text-sm font-medium text-primary hover:bg-primary/5 min-h-[44px] w-full sm:w-auto active:scale-[0.98] transition-transform"
              >
                Start Hiring — Free
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs rounded-xl border border-green-200 bg-green-50 p-4 sm:p-6 text-center">
                <div className="text-lg">🔥</div>
                <div className="mt-1 text-2xl sm:text-3xl font-bold text-green-700">8 Perfect Candidates</div>
                <p className="mt-1 text-xs sm:text-sm text-green-600">Found in 0.3 seconds</p>
                <div className="mt-3 flex justify-center gap-2">
                  <span className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white">
                    Shortlist All
                  </span>
                  <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-green-700 shadow-sm">
                    Message All
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-12 sm:py-16 md:py-20 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-text">Simple pricing</h2>
          <p className="mt-2 text-sm sm:text-base text-text-muted">Start free. Upgrade when you see results.</p>
          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="rounded-xl border border-gray-200 p-4 sm:p-6 text-left">
              <p className="font-semibold">Free</p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold">₹0</p>
              <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-text-muted">
                <li>✓ 3 resume analyses</li>
                <li>✓ ATS scoring</li>
                <li>✓ 2 auto-applies</li>
                <li>✓ Career Coach basics</li>
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
              <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-text-muted">
                <li>✓ Unlimited everything</li>
                <li>✓ Smart auto-apply</li>
                <li>✓ AI Career Coach</li>
                <li>✓ Resume Performance Index</li>
                <li>✓ Profile boost</li>
              </ul>
              <Link
                href="/signup"
                className="mt-4 block rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-white hover:bg-primary-hover min-h-[44px] flex items-center justify-center active:scale-[0.98] transition-transform"
              >
                Start Free Trial
              </Link>
            </div>
            <div className="rounded-xl border border-gray-200 p-4 sm:p-6 text-left sm:col-span-2 lg:col-span-1">
              <p className="font-semibold">Premium</p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold">
                ₹499<span className="text-sm font-normal text-text-muted">/mo</span>
              </p>
              <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-text-muted">
                <li>✓ Everything in Pro</li>
                <li>✓ Hiring prediction</li>
                <li>✓ 2.5x profile boost</li>
                <li>✓ Salary intelligence</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Moat CTAs */}
        <section className="border-t border-gray-100 py-8 sm:py-12">
          <h2 className="text-center text-base sm:text-lg font-semibold text-text">Free Career Intelligence</h2>
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
            <Link href="/skills" className="rounded-lg border px-5 py-2.5 text-sm hover:bg-gray-50 text-center min-h-[44px] flex items-center justify-center">
              🔥 Top Skills to Get Hired
            </Link>
            <Link href="/salary" className="rounded-lg border px-5 py-2.5 text-sm hover:bg-gray-50 text-center min-h-[44px] flex items-center justify-center">
              💰 Salary Data 2026
            </Link>
            <Link href="/jobs" className="rounded-lg border px-5 py-2.5 text-sm hover:bg-gray-50 text-center min-h-[44px] flex items-center justify-center">
              🎯 Browse Jobs
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-text-muted">
            <span>© {new Date().getFullYear()} AI Job Assistant</span>
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
