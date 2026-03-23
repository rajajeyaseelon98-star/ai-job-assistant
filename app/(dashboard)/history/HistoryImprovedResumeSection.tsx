import Link from "next/link";

interface Item {
  id: string;
  job_title: string | null;
  created_at: string;
}

export function HistoryImprovedResumeSection({
  items,
  loadError,
}: {
  items: Item[];
  loadError?: string | null;
}) {
  const dateStr = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <h2 className="font-display text-lg font-bold text-slate-800">Improved Resumes</h2>
      </div>
      <ul className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loadError ? (
          <li className="p-8 text-center text-xs text-rose-500 italic">
            Could not load improved resumes: {loadError}
          </li>
        ) : items.length === 0 ? (
          <li className="p-8 text-center text-xs text-slate-400 italic">
            No improved resumes yet. Use &quot;Improve my resume&quot; on the Resume Analyzer to create one.
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-sm font-medium text-slate-600 truncate">
                  {item.job_title ? `${item.job_title}` : "Improved Resume"}
                </span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {dateStr(item.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/resume-analyzer?improvedId=${item.id}`}
                  className="bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-sm rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  View
                </Link>
                <a
                  href={`/api/improved-resumes/${item.id}/download?format=docx`}
                  className="bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                  download
                >
                  Download
                </a>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
