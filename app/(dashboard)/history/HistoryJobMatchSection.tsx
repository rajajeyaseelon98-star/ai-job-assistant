import Link from "next/link";

interface Item {
  id: string;
  match_score: number;
  job_title: string | null;
  created_at: string;
}

export function HistoryJobMatchSection({ items }: { items: Item[] }) {
  const dateStr = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <section className="rounded-xl border border-gray-200 bg-card shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="font-semibold text-text">Job Matches</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.length === 0 ? (
          <li className="px-6 py-6 text-center text-sm text-text-muted">
            No job matches yet.
          </li>
        ) : (
          items.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-6 py-4">
              <span className="text-text">
                {m.job_title || "Job match"} – {m.match_score}%
              </span>
              <Link
                href={`/job-match?matchId=${m.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                View
              </Link>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
