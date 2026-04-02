"use client";

import { useState } from "react";
import { InterviewQuestions } from "@/components/interview/InterviewQuestions";
import { AIProgressIndicator } from "@/components/ui/AIProgressIndicator";
import type { InterviewPrepResponse } from "@/types/analysis";
import { useInterviewPrep } from "@/hooks/mutations/use-interview-prep";
import { formatApiFetchThrownError } from "@/lib/api-error";

const EXPERIENCE_LEVELS = ["Junior", "Mid", "Senior"] as const;

export default function InterviewPrepPage() {
  const prepMut = useInterviewPrep();
  const [role, setRole] = useState("React Developer");
  const [experienceLevel, setExperienceLevel] = useState<string>("Mid");
  const [data, setData] = useState<InterviewPrepResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = prepMut.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const json = await prepMut.mutateAsync({
        role: role.trim() || "Software Developer",
        experienceLevel: experienceLevel || undefined,
      });
      setData(json);
    } catch (e) {
      setError(formatApiFetchThrownError(e) || "Failed");
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-4 sm:space-y-6 md:space-y-8">
      <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-2">
        Interview Preparation
      </h1>
      <p className="text-slate-500 text-base mb-8">
        Enter a job role to get technical and behavioral questions with brief answers.
      </p>

      <section className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 mb-10">
        <h2 className="font-display text-xl font-bold text-slate-900 mb-6">
          Select role & experience
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Job role</label>
              <input
                type="text"
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="React Developer"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Experience level</label>
              <select
                className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 w-full transition-all focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none"
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
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl px-8 py-3.5 font-medium transition-all w-full sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating…" : "Generate questions"}
          </button>
          {loading && <AIProgressIndicator message="Generating interview questions…" />}
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      {data && (
        <section>
          <InterviewQuestions data={data} />
        </section>
      )}
    </div>
  );
}
