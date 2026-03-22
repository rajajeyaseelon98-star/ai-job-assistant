import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-2xl font-bold text-foreground">Terms of service</h1>
        <p className="mt-2 text-sm text-text-muted">Last updated: {new Date().getFullYear()}</p>
        <div className="prose prose-sm mt-8 max-w-none text-text-muted">
          <p className="text-foreground">
            By using AI Job Assistant, you agree to use the service lawfully and not to misuse automation
            features (e.g. spamming employers or misrepresenting qualifications).
          </p>
          <p className="mt-4">
            Features and pricing may change with notice where required. We provide the service &ldquo;as is&rdquo;
            and are not responsible for hiring outcomes.
          </p>
          <p className="mt-4 text-sm italic">
            This is a placeholder summary. Replace with your lawyer-reviewed terms before production.
          </p>
        </div>
      </main>
    </div>
  );
}
