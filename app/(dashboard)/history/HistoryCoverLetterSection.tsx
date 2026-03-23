"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Item {
  id: string;
  company_name: string | null;
  job_title: string | null;
  created_at: string;
}

export function HistoryCoverLetterSection({ items }: { items: Item[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dateStr = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  async function handleDownload(id: string) {
    try {
      const res = await fetch(`/api/cover-letters/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      const blob = new Blob([data.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cover-letter-${id.slice(0, 8)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this cover letter?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/cover-letters/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
        <h2 className="font-display text-lg font-bold text-slate-800">Cover Letters</h2>
      </div>
      <ul className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {items.length === 0 ? (
          <li className="p-8 text-center text-xs text-slate-400 italic">
            No cover letters yet.
          </li>
        ) : (
          items.map((c) => (
            <li key={c.id} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-sm font-medium text-slate-600 truncate">
                  {c.company_name || c.job_title || "Cover letter"}
                </span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {dateStr(c.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/cover-letter?id=${c.id}`}
                  className="bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-sm rounded-lg px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleDownload(c.id)}
                  className="bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="text-slate-300 hover:text-rose-500 p-1.5 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
