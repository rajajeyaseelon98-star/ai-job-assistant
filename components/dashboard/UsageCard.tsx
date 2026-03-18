interface UsageCardProps {
  resume: { used: number; limit: number };
  jobMatch: { used: number; limit: number };
  coverLetter: { used: number; limit: number };
  isPro: boolean;
}

export function UsageCard({ resume, jobMatch, coverLetter, isPro }: UsageCardProps) {
  const formatLimit = (n: number) => (n === -1 ? "∞" : n);

  return (
    <div className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
      <h3 className="text-sm sm:text-base md:text-lg font-medium text-text-muted">Usage this month</h3>
      <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 text-sm sm:text-base text-text">
        <li className="flex items-center justify-between gap-2">
          <span className="truncate">Resume analyses</span>
          <span className="shrink-0 font-medium">{resume.used} / {formatLimit(resume.limit)}</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="truncate">Job matches</span>
          <span className="shrink-0 font-medium">{jobMatch.used} / {formatLimit(jobMatch.limit)}</span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="truncate">Cover letters</span>
          <span className="shrink-0 font-medium">{coverLetter.used} / {formatLimit(coverLetter.limit)}</span>
        </li>
      </ul>
      {!isPro && (
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-text-muted">Free plan limits apply.</p>
      )}
    </div>
  );
}
