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
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <h2 className="font-display text-lg font-bold text-slate-800">Resume Analysis</h2>
      </div>
      <ul className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {items.length === 0 ? (
          <li className="p-8 text-center text-xs text-slate-400 italic">
            No resume analyses yet.
          </li>
        ) : (
          items.map((a) => (
            <li key={a.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600">{dateStr(a.created_at)}</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  ATS {a.score}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/resume-analyzer?analysisId=${a.id}`}
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
