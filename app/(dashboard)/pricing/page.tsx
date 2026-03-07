import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Pricing</h1>
      <p className="text-text-muted">
        Choose the plan that fits your job search.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text">Free</h2>
          <p className="mt-2 text-3xl font-bold text-text">₹0</p>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li>3 resume analyses per month</li>
            <li>3 job matches per month</li>
            <li>1 cover letter per month</li>
            <li>Interview prep (Pro+)</li>
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
            href="/settings?upgrade=pro"
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
          >
            Upgrade to Pro
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text">Premium</h2>
          <p className="mt-2 text-3xl font-bold text-text">
            ₹499 <span className="text-base font-normal text-text-muted">/month</span>
          </p>
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            <li>Everything in Pro</li>
            <li>Mock interviews (AI)</li>
            <li>Career roadmap</li>
          </ul>
          <Link
            href="/settings?upgrade=premium"
            className="mt-6 inline-block rounded-lg border border-primary px-4 py-2 font-medium text-primary hover:bg-primary/5"
          >
            Upgrade to Premium
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-card p-6">
        <h3 className="font-semibold text-text">Payment</h3>
        <p className="mt-2 text-sm text-text-muted">
          We accept Stripe and Razorpay. Click Upgrade above to manage your subscription in Settings.
        </p>
        <p className="mt-2 text-xs text-text-muted">
          Stripe: secure global payments. Razorpay: available for India. Configure in Settings or contact support.
        </p>
      </div>
    </div>
  );
}
