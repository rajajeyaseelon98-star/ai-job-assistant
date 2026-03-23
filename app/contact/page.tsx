import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-3xl mx-auto w-full py-16 px-6">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 text-sm font-medium mb-8 transition-colors">
          <span aria-hidden="true">←</span>
          Back to Home
        </Link>
        <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] p-10 sm:p-16">
          <h1 className="font-display text-4xl font-bold text-slate-900 tracking-tight mb-2">Contact</h1>
          <span className="text-slate-400 text-xs font-medium mb-10 block uppercase tracking-widest">Support</span>
          <p className="text-slate-500 text-sm mb-8">
            Questions about your account, privacy, or billing? Reach out and we&apos;ll get back to you.
          </p>
          <p>
          <a
            href="mailto:support@example.com"
            className="inline-block text-indigo-600 font-bold text-lg hover:underline underline-offset-4 mb-4"
          >
            support@example.com
          </a>
          </p>
          <p className="text-slate-600 text-base leading-relaxed mb-6">
            For the fastest resolution, include your account email and a brief summary of your issue.
          </p>
          <p className="mt-12 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-700 italic">
          Replace <code className="rounded bg-surface-muted px-1">support@example.com</code> with your real support
          address in production.
          </p>
        </div>
      </main>
    </div>
  );
}
