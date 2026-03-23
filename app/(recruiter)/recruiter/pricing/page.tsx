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
    color: "text-amber-500 bg-amber-50",
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
    color: "text-indigo-600 bg-indigo-50",
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
    color: "text-amber-500 bg-amber-50",
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
    <div className="max-w-7xl mx-auto w-full py-16 px-6">
      <div className="text-center">
        <h1 className="font-display text-5xl font-extrabold text-slate-900 tracking-tight text-center mb-4">Recruiter Plans</h1>
        <p className="text-slate-500 text-lg text-center max-w-2xl mx-auto mb-20">
          Choose the plan that fits your hiring needs. Scale as you grow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white border border-slate-200 rounded-[32px] p-8 flex flex-col transition-all duration-300 relative ${
              plan.popular
                ? "border-indigo-600 ring-2 ring-indigo-600 shadow-2xl scale-[1.03] z-10 bg-white"
                : "hover:border-indigo-200 hover:shadow-xl"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">
                Most Popular
              </div>
            )}

            <div className="mb-6">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                  plan.name === "Starter"
                    ? "bg-slate-50 text-slate-400"
                    : plan.name === "Pro"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-amber-50 text-amber-500"
                }`}
              >
                <plan.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="font-display text-4xl font-bold text-slate-900">{plan.price}</span>
              <span className="text-slate-400 text-sm font-medium">{plan.period}</span>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-slate-600 leading-tight">
                  <Check className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSelectPlan(plan.name)}
              className={`w-full rounded-2xl py-4 font-bold transition-all ${
                selectedPlan === plan.name
                  ? "bg-green-600 text-white active:bg-green-700"
                  : plan.popular
                    ? "w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 rounded-2xl py-4 font-bold transition-all"
                    : "w-full bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white hover:border-indigo-600 transition-all rounded-2xl py-4 font-bold"
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

      <div className="mt-20 bg-slate-50/50 border border-slate-200 rounded-[40px] p-10">
        <h3 className="font-display text-xl font-bold text-slate-900 mb-8 text-center">All Plans Include</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
            <div key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Check className="text-emerald-500 w-5 h-5 shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
