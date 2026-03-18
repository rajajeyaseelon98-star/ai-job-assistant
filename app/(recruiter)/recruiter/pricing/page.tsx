"use client";

import { useState } from "react";
import { Check, Zap, Crown, Building2 } from "lucide-react";

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: typeof Zap;
  color: string;
  features: string[];
  limits: { jobs: number; candidates: number; messages: number; aiScreenings: number };
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "₹999",
    period: "/month",
    description: "Perfect for small businesses and startups",
    icon: Zap,
    color: "text-blue-600 bg-blue-100",
    features: [
      "Up to 3 active job postings",
      "50 candidate searches/month",
      "20 messages/month",
      "5 AI screenings/month",
      "Basic analytics",
      "Email support",
    ],
    limits: { jobs: 3, candidates: 50, messages: 20, aiScreenings: 5 },
  },
  {
    name: "Pro",
    price: "₹4,999",
    period: "/month",
    description: "For growing teams and agencies",
    icon: Crown,
    color: "text-purple-600 bg-purple-100",
    popular: true,
    features: [
      "Up to 25 active job postings",
      "500 candidate searches/month",
      "200 messages/month",
      "50 AI screenings/month",
      "AI auto-shortlisting",
      "Top Candidates ranking access",
      "Candidate push notifications (10/day)",
      "Salary estimator",
      "Hiring success prediction",
      "Skill gap analysis",
      "Recruiter intelligence dashboard",
      "Advanced analytics",
      "Priority support",
    ],
    limits: { jobs: 25, candidates: 500, messages: 200, aiScreenings: 50 },
  },
  {
    name: "Enterprise",
    price: "₹14,999",
    period: "/month",
    description: "For large organizations with high-volume hiring",
    icon: Building2,
    color: "text-orange-600 bg-orange-100",
    features: [
      "Unlimited active job postings",
      "Unlimited candidate searches",
      "Unlimited messages",
      "Unlimited AI screenings",
      "AI auto-shortlisting",
      "Top Candidates with boost visibility",
      "Unlimited push notifications",
      "AI skill gap reports",
      "AI salary estimator",
      "AI job optimization",
      "Hiring success model access",
      "Skill demand intelligence",
      "Bulk messaging with templates",
      "Company branding",
      "Full analytics suite",
      "Dedicated account manager",
      "API access (coming soon)",
    ],
    limits: { jobs: -1, candidates: -1, messages: -1, aiScreenings: -1 },
  },
];

export default function RecruiterPricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  function handleSelectPlan(planName: string) {
    setSelectedPlan(planName);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6 md:space-y-8">
      <div className="text-center">
        <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">Recruiter Plans</h1>
        <p className="mt-2 text-sm text-text-muted">
          Choose the plan that fits your hiring needs. Scale as you grow.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border bg-card p-4 sm:p-5 md:p-6 shadow-sm transition-shadow hover:shadow-md ${
              plan.popular ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-white">
                Most Popular
              </div>
            )}

            <div className="mb-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${plan.color}`}>
                <plan.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">{plan.name}</h2>
                <p className="text-xs text-text-muted">{plan.description}</p>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <span className="text-2xl font-bold text-text sm:text-3xl">{plan.price}</span>
              <span className="text-sm text-text-muted">{plan.period}</span>
            </div>

            <ul className="mb-4 sm:mb-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-text">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.name)}
              className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                selectedPlan === plan.name
                  ? "bg-green-600 text-white active:bg-green-700"
                  : plan.popular
                    ? "bg-primary text-white hover:bg-primary/90 active:bg-primary/80"
                    : "border border-gray-300 text-text hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              {selectedPlan === plan.name ? "Selected" : "Get Started"}
            </button>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4 text-center">
          <p className="text-sm text-blue-800">
            You selected the <strong>{selectedPlan}</strong> plan. Payment integration coming soon.
            For now, all features are available during the beta period.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-card p-3 sm:p-4 md:p-5 lg:p-6">
        <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">All Plans Include</h3>
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Role-based access control",
            "Secure data handling",
            "ATS pipeline management",
            "Company profile page",
            "Candidate messaging",
            "Application tracking",
            "Interview scheduling",
            "Job description AI generator",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-text-muted">
              <Check className="h-4 w-4 shrink-0 text-green-500" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
