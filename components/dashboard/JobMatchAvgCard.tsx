import Link from "next/link";

interface JobMatchAvgCardProps {
  avgScore: number | null;
}

export function JobMatchAvgCard({ avgScore }: JobMatchAvgCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
      <h3 className="text-sm sm:text-base md:text-lg font-medium text-text-muted">Job Match Avg</h3>
      <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-text">
          {avgScore !== null ? Math.round(avgScore) : "—"}
        </span>
        <span className="text-sm sm:text-base text-text-muted">%</span>
      </div>
      <div className="mt-3 sm:mt-4 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${avgScore ?? 0}%` }}
        />
      </div>
      <Link
        href="/job-match"
        className="mt-3 sm:mt-4 flex items-center min-h-[44px] min-w-[44px] text-sm sm:text-base font-medium text-primary hover:underline active:opacity-70 active:bg-gray-100 rounded-md transition-colors"
      >
        Match job →
      </Link>
    </div>
  );
}
