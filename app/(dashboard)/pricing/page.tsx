"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Zap, Crown, Rocket, Star } from "lucide-react";

interface Plan {
  name: string;
  price: string;
  period: string;
  icon: typeof Zap;
  color: string;
  features: string[];
  popular?: boolean;
  planKey: "free" | "pro" | "premium";
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "₹0",
    period: "",
    icon: Star,
    color: "text-gray-600 bg-gray-100",
    planKey: "free",
    features: [
      "3 resume analyses per month",
      "3 job matches per month",
      "1 cover letter per month",
      "1 job finder search per month",
      "2 AI Auto-Apply runs per month",
      "Activity feed",
      "Salary insights (basic)",
    ],
  },
  {
    name: "Pro",
    price: "₹299",
    period: "/month",
    icon: Crown,
    color: "text-purple-600 bg-purple-100",
    popular: true,
    planKey: "pro",
    features: [
      "Unlimited resume analyses",
      "Unlimited job matches",
      "Unlimited cover letters",
      "Interview preparation tool",
      "AI Resume Fixer",
      "Unlimited Auto Job Finder",
      "Unlimited AI Auto-Apply",
      "Smart Auto-Apply (set & forget)",
      "Resume tailoring for specific jobs",
      "LinkedIn profile import",
      "Career Analytics dashboard",
      "Skill demand insights",
      "Profile boost (2x visibility)",
      "Daily AI reports",
    ],
  },
  {
    name: "Premium",
    price: "₹499",
    period: "/month",
    icon: Rocket,
    color: "text-orange-600 bg-orange-100",
    planKey: "premium",
    features: [
      "Everything in Pro",
      "Mock interviews (AI)",
      "Hiring success prediction",
      "Priority AI processing",
      "Profile boost (2.5x visibility)",
      "Shareable score cards",
      "Public profile with badges",
      "Career roadmap (coming soon)",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  async function handleUpgrade(plan: "pro" | "premium") {
    setUpgrading(plan);
    alert(
      `Payment integration coming soon!\n\nTo test ${plan} features locally, use the plan switcher in Settings (dev mode only).`
    );
    setUpgrading(null);
    router.push("/settings");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6 md:space-y-8">
      <div className="text-center">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Pricing</h1>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-text-muted">
          Choose the plan that fits your job search. Upgrade anytime.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border bg-card p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md ${
              plan.popular ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-white">
                Most Popular
              </div>
            )}

            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full ${plan.color}`}>
                <plan.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-text">{plan.name}</h2>
            </div>

            <div className="mb-4 sm:mb-6">
              <span className="text-2xl sm:text-3xl font-bold text-text">{plan.price}</span>
              {plan.period && (
                <span className="text-sm text-text-muted">{plan.period}</span>
              )}
            </div>

            <ul className="mb-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-xs sm:text-sm text-text">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            {plan.planKey === "free" ? (
              <p className="text-center text-sm text-text-muted">No credit card required</p>
            ) : (
              <button
                type="button"
                onClick={() => handleUpgrade(plan.planKey as "pro" | "premium")}
                disabled={upgrading === plan.planKey}
                className={`w-full min-h-[44px] rounded-lg px-4 py-2.5 text-sm font-medium transition-colors active:scale-[0.98] ${
                  plan.popular
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "border border-primary text-primary hover:bg-primary/5"
                } disabled:opacity-50`}
              >
                {upgrading === plan.planKey ? "Processing..." : `Upgrade to ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 sm:p-4 md:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-amber-900">Payment integration</h3>
        <p className="mt-2 text-xs sm:text-sm text-amber-800">
          Stripe and Razorpay payment integration is in progress. For now, use the plan switcher
          in Settings when running locally to test plan-gated features.
        </p>
      </div>
    </div>
  );
}
