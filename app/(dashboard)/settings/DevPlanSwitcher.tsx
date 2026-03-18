"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchUsageUpdated } from "@/components/layout/Topbar";

type PlanType = "free" | "pro" | "premium";

interface DevPlanSwitcherProps {
  currentPlan: PlanType;
}

export function DevPlanSwitcher({ currentPlan }: DevPlanSwitcherProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanType>(currentPlan);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as PlanType;
    setPlan(value);
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dev/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage("Plan updated. Refreshing…");
        dispatchUsageUpdated();
        router.refresh();
      } else {
        setMessage(data.error || "Failed to update plan");
      }
    } catch {
      setMessage("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:p-6 shadow-sm">
      <h2 className="font-semibold text-amber-900">Local testing: switch plan</h2>
      <p className="mt-1 text-sm text-amber-800">
        Only works when running locally (<code className="rounded bg-amber-100 px-1">npm run dev</code>). Use this to test Free vs Pro vs Premium behavior.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <select
          value={plan}
          onChange={handleChange}
          disabled={loading}
          className="min-h-[44px] rounded-lg border border-amber-300 bg-white px-3 py-2 text-base sm:text-sm text-text disabled:opacity-50"
        >
          <option value="free">Free (limits apply)</option>
          <option value="pro">Pro (unlimited)</option>
          <option value="premium">Premium (unlimited)</option>
        </select>
        {message && (
          <span className="text-sm text-amber-800">{message}</span>
        )}
      </div>
    </section>
  );
}
