import Link from "next/link";

interface JobMatchAvgCardProps {
  avgScore: number | null;
}

export function JobMatchAvgCard({ avgScore }: JobMatchAvgCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-display text-base font-semibold text-slate-600">Job Match Avg</h3>
      <div className="mt-2 flex items-baseline gap-2 sm:mt-3">
        <span className="text-3xl font-bold text-slate-900 md:text-4xl">
          {avgScore !== null ? Math.round(avgScore) : "—"}
        </span>
        <span className="font-sans text-sm text-slate-500 md:text-base">%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${avgScore ?? 0}%` }}
        />
      </div>
      <Link
        href="/job-match"
        className="mt-4 flex min-h-[44px] min-w-[44px] items-center rounded-md text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-500 hover:underline active:opacity-70 sm:text-base"
      >
        Match job →
      </Link>
    </div>
  );
}
