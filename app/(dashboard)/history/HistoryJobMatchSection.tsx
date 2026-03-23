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
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <h2 className="font-display text-lg font-bold text-slate-800">Job Matches</h2>
      </div>
      <ul className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {items.length === 0 ? (
          <li className="p-8 text-center text-xs text-slate-400 italic">
            No job matches yet.
          </li>
        ) : (
          items.map((m) => (
            <li key={m.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-sm font-medium text-slate-600 truncate">{m.job_title || "Job match"}</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {m.match_score}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/job-match?matchId=${m.id}`}
                  className="bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-sm rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  View
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
