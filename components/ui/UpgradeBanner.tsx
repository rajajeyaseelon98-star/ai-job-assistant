"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

interface UpgradeBannerProps {
  feature: string;
  usedCount: number;
  limit: number;
}

export function UpgradeBanner({ feature, usedCount, limit }: UpgradeBannerProps) {
  const remaining = Math.max(0, limit - usedCount);
  const isExhausted = remaining === 0;
  const isLow = remaining <= 1 && remaining > 0;

  if (!isExhausted && !isLow) return null;

  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
      isExhausted
        ? "border-red-200 bg-red-50"
        : "border-amber-200 bg-amber-50"
    }`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Sparkles className={`h-5 w-5 shrink-0 ${isExhausted ? "text-red-500" : "text-amber-500"}`} />
        <div>
          <p className={`text-sm font-medium ${isExhausted ? "text-red-800" : "text-amber-800"}`}>
            {isExhausted
              ? `You've used all ${limit} free ${feature}`
              : `Only ${remaining} free ${feature} remaining`}
          </p>
          <p className={`text-xs ${isExhausted ? "text-red-600" : "text-amber-600"}`}>
            {isExhausted
              ? `Upgrade to Pro for unlimited ${feature}`
              : "Upgrade now to never worry about limits"}
          </p>
        </div>
      </div>
      <Link
        href="/pricing"
        className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium text-white min-h-[36px] inline-flex items-center active:scale-[0.98] transition-transform ${
          isExhausted ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
        }`}
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
