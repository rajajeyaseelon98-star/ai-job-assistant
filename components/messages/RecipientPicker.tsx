"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Search, User } from "lucide-react";
import { apiFetch } from "@/lib/api-fetcher";

type Row = { id: string; name: string | null; email: string; role: string };

export function RecipientPicker({
  receiverId,
  onReceiverIdChange,
}: {
  receiverId: string;
  onReceiverIdChange: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const runSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ results: Row[] }>(
        `/api/messages/recipient-search?q=${encodeURIComponent(term.trim())}`
      );
      setResults(res.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(q);
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [q, runSearch]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /** Deep-linked `receiver_id`: show a short label in the field when the user did not pick from search. */
  useEffect(() => {
    if (!receiverId) return;
    setQ((prev) => {
      if (prev.trim() !== "") return prev;
      return `Recipient …${receiverId.slice(-8)}`;
    });
  }, [receiverId]);

  function pick(r: Row) {
    onReceiverIdChange(r.id);
    setQ(`${r.name?.trim() || r.email}${r.name ? ` · ${r.email}` : ""}`);
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={wrapRef} className="relative space-y-1">
      <label className="text-xs font-semibold text-text-muted">To</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onReceiverIdChange("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or email (min. 2 characters)…"
          className="input-field rounded-xl pl-10 pr-4"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted" />
        )}
      </div>
      {receiverId && (
        <p className="flex items-center gap-2 text-xs text-text-muted">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 break-words">
            Recipient locked in — search again to change. ID …{receiverId.slice(-8)}
          </span>
        </p>
      )}
      {open && q.trim().length >= 2 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg">
          {results.length === 0 && !loading ? (
            <li className="px-4 py-3 text-sm text-text-muted">No matches</li>
          ) : (
            results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="flex min-h-11 w-full min-w-0 flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-muted active:bg-surface-muted/70"
                >
                  <span className="w-full truncate font-semibold text-text">{r.name?.trim() || "—"}</span>
                  <span className="w-full truncate text-xs text-text-muted">{r.email}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
