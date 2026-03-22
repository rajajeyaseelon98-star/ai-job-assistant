import Link from "next/link";

export default function ContactPage() {
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
        <h1 className="text-2xl font-bold text-foreground">Contact</h1>
        <p className="mt-4 text-text-muted">
          Questions about your account, privacy, or billing? Reach out and we&apos;ll get back to you.
        </p>
        <p className="mt-6">
          <a
            href="mailto:support@example.com"
            className="font-medium text-primary hover:underline"
          >
            support@example.com
          </a>
        </p>
        <p className="mt-4 text-sm text-text-muted">
          Replace <code className="rounded bg-surface-muted px-1">support@example.com</code> with your real support
          address in production.
        </p>
      </main>
    </div>
  );
}
