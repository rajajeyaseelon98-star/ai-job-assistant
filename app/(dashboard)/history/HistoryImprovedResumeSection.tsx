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
    <section className="rounded-xl border border-gray-200 bg-card shadow-sm">
      <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <h2 className="font-semibold text-text">Improved Resumes</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {loadError ? (
          <li className="px-4 sm:px-6 py-6 text-center text-sm text-red-600">
            Could not load improved resumes: {loadError}
          </li>
        ) : items.length === 0 ? (
          <li className="px-4 sm:px-6 py-6 text-center text-sm text-text-muted">
            No improved resumes yet. Use &quot;Improve my resume&quot; on the Resume Analyzer to create one.
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
              <span className="text-sm sm:text-base text-text truncate">
                {item.job_title ? `${item.job_title} – ` : ""}
                {dateStr(item.created_at)}
              </span>
              <div className="flex items-center gap-3 sm:gap-2">
                <Link
                  href={`/resume-analyzer?improvedId=${item.id}`}
                  className="min-h-[44px] sm:min-h-0 flex items-center text-sm font-medium text-primary hover:underline active:text-primary-hover"
                >
                  View
                </Link>
                <a
                  href={`/api/improved-resumes/${item.id}/download?format=docx`}
                  className="min-h-[44px] sm:min-h-0 flex items-center text-sm font-medium text-text-muted hover:text-text active:text-text"
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
