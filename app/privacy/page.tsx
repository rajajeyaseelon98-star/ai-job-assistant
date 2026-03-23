import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-3xl mx-auto w-full py-16 px-6">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 text-sm font-medium mb-8 transition-colors">
          <span aria-hidden="true">←</span>
          Back to Home
        </Link>
        <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] p-10 sm:p-16">
          <h1 className="font-display text-4xl font-bold text-slate-900 tracking-tight mb-2">Privacy Policy</h1>
          <span className="text-slate-400 text-xs font-medium mb-10 block uppercase tracking-widest">Last updated: {new Date().getFullYear()}</span>
          <p className="text-slate-600 text-base leading-relaxed mb-6">
            We collect only what we need to run your account: email, resume content you upload, and usage data to
            improve the product. We do not sell your personal data.
          </p>
          <p className="text-slate-600 text-base leading-relaxed mb-6">
            Resume text and files are processed to provide ATS analysis, job matching, and application features.
            You may delete your account or request data removal by contacting us.
          </p>
          <p className="text-slate-600 text-base leading-relaxed mb-6">
            Third-party services (e.g. authentication, hosting) may process data under their own policies. We use
            industry-standard encryption in transit (HTTPS).
          </p>
          <p className="mt-12 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-700 italic">
            This is a placeholder summary. Replace with your lawyer-reviewed policy before production.
          </p>
        </div>
      </main>
    </div>
  );
}
