"use client";

import { useState } from "react";
import { InterviewQuestions } from "@/components/interview/InterviewQuestions";
import { AIProgressIndicator } from "@/components/ui/AIProgressIndicator";
import type { InterviewPrepResponse } from "@/types/analysis";

const EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior"] as const;

export default function InterviewPrepPage() {
  const [role, setRole] = useState("React Developer");
  const [experienceLevel, setExperienceLevel] = useState<string>("Mid");
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
        body: JSON.stringify({
          role: role.trim() || "Software Developer",
          experienceLevel: experienceLevel || undefined,
        }),
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
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">Interview Preparation</h1>
      <p className="text-sm sm:text-base text-text-muted">
        Enter a job role to get technical and behavioral questions with brief answers.
      </p>

      <section className="rounded-xl border border-gray-200 bg-card px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 shadow-sm">
        <h2 className="mb-4 text-lg sm:text-xl font-semibold text-text">Select role & experience</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-text">Job role</label>
              <input
                type="text"
                className="mt-1 w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm text-text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="React Developer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text">Experience level</label>
              <select
                className="mt-1 w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm text-text"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px] rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate questions"}
          </button>
          {loading && <AIProgressIndicator message="Generating interview questions…" />}
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      {data && (
        <section>
          <h2 className="mb-4 text-lg sm:text-xl font-semibold text-text">Questions</h2>
          <InterviewQuestions data={data} />
        </section>
      )}
    </div>
  );
}
