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
    <div className="max-w-6xl mx-auto w-full py-12 px-4">
      <div className="text-center">
        <h1 className="font-display text-4xl font-extrabold text-slate-900 tracking-tight text-center mb-4">Pricing</h1>
        <p className="text-slate-500 text-lg text-center max-w-2xl mx-auto mb-16">
          Choose the plan that fits your job search. Upgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white border border-slate-200 rounded-3xl p-8 flex flex-col transition-all duration-300 relative ${
              plan.planKey === "free"
                ? "hover:border-slate-300"
                : plan.popular
                ? "border-indigo-600 ring-1 ring-indigo-600 shadow-xl scale-105 z-10"
                : "border-slate-200 hover:border-indigo-300 bg-slate-50/30"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                Most Popular
              </div>
            )}

            <div>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                  plan.planKey === "pro"
                    ? "bg-indigo-50 text-indigo-600"
                    : plan.planKey === "premium"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-slate-50 text-slate-500"
                }`}
              >
                <plan.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">{plan.name}</h2>
            </div>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
              {plan.period && (
                <span className="text-slate-500 font-medium">{plan.period}</span>
              )}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-slate-600">
                  <Check className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            {plan.planKey === "free" ? (
              <button
                type="button"
                disabled
                className="w-full bg-white border border-slate-200 text-slate-400 cursor-not-allowed rounded-xl py-4 font-bold mt-auto"
              >
                Current Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleUpgrade(plan.planKey as "pro" | "premium")}
                disabled={upgrading === plan.planKey}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl py-4 font-bold transition-all mt-auto disabled:opacity-50"
              >
                {upgrading === plan.planKey ? "Processing..." : `Upgrade to ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-4">
          Payment Integration
        </span>
        <p className="text-sm text-slate-500 leading-relaxed">
          Stripe and Razorpay payment integration is in progress. For now, use the plan switcher
          in Settings when running locally to test plan-gated features.
        </p>
      </div>
    </div>
  );
}
