import Link from "next/link";

interface ScoreCardProps {
  score: number | null;
}

export function ScoreCard({ score }: ScoreCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
      <h3 className="text-sm font-medium text-text-muted">ATS Score</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-bold text-text">
          {score !== null ? score : "—"}
        </span>
        <span className="text-text-muted">/ 100</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
      <Link
        href="/resume-analyzer"
        className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
      >
        Improve resume →
      </Link>
    </div>
  );
}
