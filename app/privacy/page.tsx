import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold text-primary">
            AI Job Assistant
          </Link>
          <Link href="/" className="text-sm text-text-muted hover:text-foreground">
            Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">Privacy policy</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated: {new Date().getFullYear()}</p>
        <div className="prose prose-sm mt-8 max-w-none text-text-muted">
          <p className="text-foreground">
            We collect only what we need to run your account: email, resume content you upload, and usage data to
            improve the product. We do not sell your personal data.
          </p>
          <p className="mt-4">
            Resume text and files are processed to provide ATS analysis, job matching, and application features.
            You may delete your account or request data removal by contacting us.
          </p>
          <p className="mt-4">
            Third-party services (e.g. authentication, hosting) may process data under their own policies. We use
            industry-standard encryption in transit (HTTPS).
          </p>
          <p className="mt-4 text-sm italic">
            This is a placeholder summary. Replace with your lawyer-reviewed policy before production.
          </p>
        </div>
      </main>
    </div>
  );
}
