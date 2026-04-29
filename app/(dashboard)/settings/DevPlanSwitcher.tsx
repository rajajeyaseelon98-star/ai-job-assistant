"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";
import { useDevPlanPatch } from "@/hooks/mutations/use-dev-plan";
import { formatApiFetchThrownError } from "@/lib/api-error";

type PlanType = "free" | "pro" | "premium";

interface DevPlanSwitcherProps {
  currentPlan: PlanType;
}

export function DevPlanSwitcher({ currentPlan }: DevPlanSwitcherProps) {
  const router = useRouter();
  const planMut = useDevPlanPatch();
  const [plan, setPlan] = useState<PlanType>(currentPlan);
  const [message, setMessage] = useState<string | null>(null);
  const loading = planMut.isPending;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as PlanType;
    setPlan(value);
    setMessage(null);
    try {
      await planMut.mutateAsync(value);
      setMessage("Plan updated. Refreshing…");
      dispatchUsageUpdated();
      router.refresh();
    } catch (e) {
      setMessage(formatApiFetchThrownError(e) || "Request failed");
    }
  }

  return (
    <section className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-8">
      <h2 className="text-amber-800 font-bold text-sm mb-2">Local testing: switch plan</h2>
      <p className="text-amber-700 text-xs leading-relaxed">
        Only works when running locally (<code className="rounded bg-amber-100 px-1">npm run dev</code>). Use this to test Free vs Pro vs Premium behavior.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <select
          value={plan}
          onChange={handleChange}
          disabled={loading}
          className="bg-white border border-amber-200 text-amber-900 rounded-xl px-4 py-3 w-full sm:w-auto transition-all outline-none disabled:opacity-50"
        >
          <option value="free">Free (limits apply)</option>
          <option value="pro">Pro (unlimited)</option>
          <option value="premium">Premium (unlimited)</option>
        </select>
        {message && (
          <span className="text-xs text-amber-800">{message}</span>
        )}
      </div>
    </section>
  );
}
