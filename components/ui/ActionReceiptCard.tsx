"use client";

import Link from "next/link";

type ActionReceiptCardProps = {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function ActionReceiptCard({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: ActionReceiptCardProps) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-900">{title}</p>
      <p className="mt-1 text-sm text-emerald-800">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {primaryHref && primaryLabel ? (
          <Link
            href={primaryHref}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            {primaryLabel}
          </Link>
        ) : null}
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
