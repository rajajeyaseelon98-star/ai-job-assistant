"use client";

import { useState } from "react";
import { InterviewQuestions } from "@/components/interview/InterviewQuestions";
import type { InterviewPrepResponse } from "@/types/analysis";

export default function InterviewPrepPage() {
  const [role, setRole] = useState("React Developer");
  const [data, setData] = useState<InterviewPrepResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role.trim() || "Software Developer" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to generate");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">Interview Preparation</h1>
      <p className="text-text-muted">
        Enter a job role to get technical and behavioral questions with brief answers.
      </p>

      <section className="rounded-xl border border-gray-200 bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-text">Role</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="block text-sm font-medium text-text">Job role</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="React Developer"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate questions"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      {data && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-text">Questions</h2>
          <InterviewQuestions data={data} />
        </section>
      )}
    </div>
  );
}
