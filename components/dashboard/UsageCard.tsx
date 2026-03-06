interface UsageCardProps {
  resume: { used: number; limit: number };
  jobMatch: { used: number; limit: number };
  coverLetter: { used: number; limit: number };
  isPro: boolean;
}

export function UsageCard({ resume, jobMatch, coverLetter, isPro }: UsageCardProps) {
  const formatLimit = (n: number) => (n === -1 ? "∞" : n);

  return (
    <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
      <h3 className="text-sm font-medium text-text-muted">Usage this month</h3>
      <ul className="mt-3 space-y-2 text-sm text-text">
        <li>Resume analyses: {resume.used} / {formatLimit(resume.limit)}</li>
        <li>Job matches: {jobMatch.used} / {formatLimit(jobMatch.limit)}</li>
        <li>Cover letters: {coverLetter.used} / {formatLimit(coverLetter.limit)}</li>
      </ul>
      {!isPro && (
        <p className="mt-3 text-xs text-text-muted">Free plan limits apply.</p>
      )}
    </div>
  );
}
