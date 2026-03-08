import Link from "next/link";

interface Item {
  id: string;
  job_title: string | null;
  created_at: string;
}

export function HistoryImprovedResumeSection({ items }: { items: Item[] }) {
  const dateStr = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <section className="rounded-xl border border-gray-200 bg-card shadow-sm">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 className="font-semibold text-text">Improved Resumes</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.length === 0 ? (
          <li className="px-6 py-6 text-center text-sm text-text-muted">
            No improved resumes yet.
          </li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
              <span className="text-text">
                {item.job_title ? `${item.job_title} – ` : ""}
                {dateStr(item.created_at)}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/resume-analyzer?improvedId=${item.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View
                </Link>
                <a
                  href={`/api/improved-resumes/${item.id}/download?format=docx`}
                  className="text-sm font-medium text-text-muted hover:text-text"
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
