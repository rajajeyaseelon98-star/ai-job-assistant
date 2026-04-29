"use client";

import Link from "next/link";

type AICreditExhaustedAlertProps = {
  message: string;
  pricingHref?: string;
};

export function AICreditExhaustedAlert({
  message,
  pricingHref = "/pricing",
}: AICreditExhaustedAlertProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-800">{message}</p>
      <Link
        href={pricingHref}
        className="mt-2 inline-flex rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
      >
        Upgrade plan
      </Link>
    </div>
  );
}

