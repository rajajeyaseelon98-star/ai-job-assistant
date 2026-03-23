interface UsageCardProps {
  resume: { used: number; limit: number };
  jobMatch: { used: number; limit: number };
  coverLetter: { used: number; limit: number };
  isPro: boolean;
}

export function UsageCard({ resume, jobMatch, coverLetter, isPro }: UsageCardProps) {
  const formatLimit = (n: number) => (n === -1 ? "∞" : n);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-display text-base font-semibold text-slate-600">Usage this month</h3>
      <ul className="mt-4 space-y-2 font-sans text-sm text-slate-800 sm:space-y-3 sm:text-base">
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
        <p className="mt-4 font-sans text-xs text-slate-500 sm:text-sm">Free plan limits apply.</p>
      )}
    </div>
  );
}
