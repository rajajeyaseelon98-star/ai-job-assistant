import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-3xl mx-auto w-full py-16 px-6">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 text-sm font-medium mb-8 transition-colors">
          <span aria-hidden="true">←</span>
          Back to Home
        </Link>
        <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] p-10 sm:p-16">
          <h1 className="font-display text-4xl font-bold text-slate-900 tracking-tight mb-2">Terms of Service</h1>
          <span className="text-slate-400 text-xs font-medium mb-10 block uppercase tracking-widest">Last updated: {new Date().getFullYear()}</span>
          <p className="text-slate-600 text-base leading-relaxed mb-6">
            By using AI Job Assistant, you agree to use the service lawfully and not to misuse automation
            features (e.g. spamming employers or misrepresenting qualifications).
          </p>
          <p className="text-slate-600 text-base leading-relaxed mb-6">
            Features and pricing may change with notice where required. We provide the service &ldquo;as is&rdquo;
            and are not responsible for hiring outcomes.
          </p>
          <p className="mt-12 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-700 italic">
            This is a placeholder summary. Replace with your lawyer-reviewed terms before production.
          </p>
        </div>
      </main>
    </div>
  );
}
