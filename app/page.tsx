import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-gray-200 bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-xl font-semibold text-primary">
            AI Job Assistant
          </span>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-text-muted hover:text-text"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary-hover"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text md:text-5xl">
            Land your next dev job with AI
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            Improve your resume, match job descriptions, generate cover letters,
            and prepare for interviews—all powered by AI for developers with
            0–5 years experience.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-primary px-6 py-3 text-lg font-medium text-white hover:bg-primary-hover"
          >
            Get started free
          </Link>
        </section>

        <section className="mt-24 grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Resume analysis",
              desc: "Get ATS score, strengths, weaknesses, and actionable suggestions.",
            },
            {
              title: "Job matching",
              desc: "See how well your resume matches a job and which keywords to add.",
            },
            {
              title: "Cover letters & interviews",
              desc: "Generate cover letters and practice technical and behavioral questions.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm"
            >
              <h3 className="font-semibold text-text">{f.title}</h3>
              <p className="mt-2 text-text-muted">{f.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-24 rounded-2xl border border-gray-200 bg-card p-8 text-center md:p-12">
          <h2 className="text-2xl font-bold text-text">Simple pricing</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
            <div className="rounded-xl border border-gray-200 p-6">
              <p className="font-semibold">Free</p>
              <p className="mt-1 text-2xl font-bold">₹0</p>
              <p className="mt-2 text-sm text-text-muted">
                2 resume analyses · 1 job match · 1 cover letter
              </p>
            </div>
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-6">
              <p className="font-semibold text-primary">Pro</p>
              <p className="mt-1 text-2xl font-bold">₹199<span className="text-base font-normal text-text-muted">/month</span></p>
              <p className="mt-2 text-sm text-text-muted">
                Unlimited analyses, matches, cover letters & interview prep
              </p>
              <Link
                href="/signup"
                className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-text-muted">
        © {new Date().getFullYear()} AI Job Assistant
      </footer>
    </div>
  );
}
