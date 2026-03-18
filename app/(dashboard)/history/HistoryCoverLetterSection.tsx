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
    <section className="rounded-xl border border-gray-200 bg-card shadow-sm">
      <div className="border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <h2 className="font-semibold text-text">Cover Letters</h2>
      </div>
      <ul className="divide-y divide-gray-100">
        {items.length === 0 ? (
          <li className="px-4 sm:px-6 py-6 text-center text-sm text-text-muted">
            No cover letters yet.
          </li>
        ) : (
          items.map((c) => (
            <li key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4">
              <span className="text-sm sm:text-base text-text truncate">
                {c.company_name || c.job_title || "Cover letter"} – {dateStr(c.created_at)}
              </span>
              <div className="flex items-center gap-3 sm:gap-2">
                <Link
                  href={`/cover-letter?id=${c.id}`}
                  className="min-h-[44px] sm:min-h-0 flex items-center text-sm font-medium text-primary hover:underline active:text-primary-hover"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => handleDownload(c.id)}
                  className="min-h-[44px] sm:min-h-0 flex items-center text-sm font-medium text-text-muted hover:text-text active:text-text"
                >
                  Download
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="min-h-[44px] sm:min-h-0 flex items-center text-sm font-medium text-red-600 hover:underline active:text-red-700 disabled:opacity-50"
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
