import Link from "next/link";

interface Item {
  id: string;
  score: number;
  created_at: string;
}

export function HistoryResumeSection({ items }: { items: Item[] }) {
  const dateStr = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <section className="rounded-xl border border-gray-200 bg-card shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="font-semibold text-text">Resume Analysis</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.length === 0 ? (
          <li className="px-6 py-6 text-center text-sm text-text-muted">
            No resume analyses yet.
          </li>
        ) : (
          items.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-6 py-4">
              <span className="text-text">
                {dateStr(a.created_at)} – ATS Score {a.score}
              </span>
              <Link
                href={`/resume-analyzer?analysisId=${a.id}`}
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
