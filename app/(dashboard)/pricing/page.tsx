import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Pricing</h1>
      <p className="text-text-muted">
        Choose the plan that fits your job search.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text">Free</h2>
          <p className="mt-2 text-3xl font-bold text-text">₹0</p>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li>2 resume analyses per month</li>
            <li>1 job match per month</li>
            <li>1 cover letter per month</li>
            <li>Interview prep (Pro only)</li>
          </ul>
          <p className="mt-4 text-sm text-text-muted">No credit card required.</p>
        </div>

        <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-primary">Pro</h2>
          <p className="mt-2 text-3xl font-bold text-text">
            ₹199 <span className="text-base font-normal text-text-muted">/month</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li>Unlimited resume analyses</li>
            <li>Unlimited job matches</li>
            <li>Unlimited cover letters</li>
            <li>Interview preparation tool</li>
          </ul>
          <Link
            href="/settings"
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
