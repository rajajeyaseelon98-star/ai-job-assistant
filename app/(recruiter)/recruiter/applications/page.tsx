"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, Brain, ChevronDown, ChevronUp } from "lucide-react";
import type { JobApplication, ApplicationStage } from "@/types/recruiter";
import { STAGE_LABELS, STAGE_COLORS } from "@/types/recruiter";

const PIPELINE_STAGES: ApplicationStage[] = [
  "applied", "shortlisted", "interview_scheduled", "interviewed", "offer_sent", "hired", "rejected",
];
const STAGE_DOT_COLORS: Record<ApplicationStage, string> = {
  applied: "bg-blue-500",
  shortlisted: "bg-indigo-500",
  interview_scheduled: "bg-amber-500",
  interviewed: "bg-amber-500",
  offer_sent: "bg-emerald-500",
  hired: "bg-emerald-500",
  rejected: "bg-rose-500",
};

export default function RecruiterApplicationsPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [screeningId, setScreeningId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/recruiter/applications")
      .then((r) => (r.ok ? r.json() : []))
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  async function updateStage(id: string, stage: ApplicationStage) {
    const res = await fetch(`/api/recruiter/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    }
  }

  async function runScreening(id: string) {
    setScreeningId(id);
    try {
      const res = await fetch(`/api/recruiter/applications/${id}/screen`, { method: "POST" });
      if (res.ok) {
        const screening = await res.json();
        setApps((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, ai_screening: screening, ai_summary: screening.summary, match_score: screening.ats_score }
              : a
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setScreeningId(null);
    }
  }

  async function updateRating(id: string, rating: number) {
    const res = await fetch(`/api/recruiter/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recruiter_rating: rating }),
    });
    if (res.ok) {
      setApps((prev) => prev.map((a) => (a.id === id ? { ...a, recruiter_rating: rating } : a)));
    }
  }

  if (loading) return <p className="text-sm text-text-muted">Loading applications...</p>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h1 className="text-xl font-bold text-text sm:text-2xl lg:text-3xl">Applications Pipeline</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("pipeline")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium min-h-[44px] sm:min-h-0 ${view === "pipeline" ? "bg-primary text-white" : "bg-gray-100 text-text-muted active:bg-gray-200"}`}
          >Pipeline</button>
          <button
            onClick={() => setView("list")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium min-h-[44px] sm:min-h-0 ${view === "list" ? "bg-primary text-white" : "bg-gray-100 text-text-muted active:bg-gray-200"}`}
          >List</button>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-sm text-text-muted">No applications yet.</p>
        </div>
      ) : view === "pipeline" ? (
        <div className="bg-slate-50/50 border border-slate-200 rounded-3xl p-6 min-h-[75vh]">
          <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {PIPELINE_STAGES.map((stage) => {
            const stageApps = apps.filter((a) => a.stage === stage);
            return (
              <div key={stage} className="flex-1 min-w-[300px] max-w-[350px] flex flex-col">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-transparent z-10">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${STAGE_DOT_COLORS[stage]}`} />
                    <span className="font-display text-sm font-bold text-slate-700">{STAGE_LABELS[stage]}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">
                    {stageApps.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {stageApps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      onStageChange={updateStage}
                      onScreen={runScreening}
                      onRate={updateRating}
                      screeningId={screeningId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {apps
            .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
            .map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onStageChange={updateStage}
                onScreen={runScreening}
                onRate={updateRating}
                screeningId={screeningId}
                showStage
              />
            ))}
        </div>
      )}
    </div>
  );
}

function AppCard({
  app,
  onStageChange,
  onScreen,
  onRate,
  screeningId,
  showStage,
}: {
  app: JobApplication;
  onStageChange: (id: string, stage: ApplicationStage) => void;
  onScreen: (id: string) => void;
  onRate: (id: string, rating: number) => void;
  screeningId: string | null;
  showStage?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const candidate = app.candidate as Record<string, unknown> | undefined;
  const job = app.job as Record<string, unknown> | undefined;

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 mb-3 hover:border-indigo-300 hover:shadow-md transition-all cursor-grab group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-sm font-bold text-slate-900 group-hover:text-indigo-600 mb-1 truncate">
            {(candidate?.name as string) || (candidate?.email as string) || "Candidate"}
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 mb-3">{(job?.title as string) || "Job"}</p>
        </div>
        {app.match_score !== null && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
            {app.match_score}%
          </span>
        )}
      </div>

      {showStage && (
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STAGE_COLORS[app.stage]}`}>
          {STAGE_LABELS[app.stage]}
        </span>
      )}

      {/* Rating */}
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => onRate(app.id, star)} className="p-0.5 min-h-[28px] min-w-[28px] sm:min-h-0 sm:min-w-0 flex items-center justify-center">
            <Star className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${star <= (app.recruiter_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          </button>
        ))}
      </div>

      {app.ai_summary && (
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 mb-3">{app.ai_summary}</p>
      )}

      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => onScreen(app.id)}
          disabled={screeningId === app.id}
          className="w-full bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 py-1.5 rounded-lg text-[10px] font-bold transition-all border border-transparent hover:border-indigo-100 flex items-center justify-center gap-1 disabled:opacity-50"
        >
          {screeningId === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
          AI Screen
        </button>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary hover:underline flex items-center gap-0.5 min-h-[36px] sm:min-h-0">
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Less" : "More"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          <select
            value={app.stage}
            onChange={(e) => onStageChange(app.id, e.target.value as ApplicationStage)}
            className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-base sm:text-xs text-text min-h-[44px] sm:min-h-0"
          >
            {PIPELINE_STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
          {app.ai_screening && (
            <div className="rounded bg-purple-50 p-2 text-xs">
              {(() => {
                const s = app.ai_screening as unknown as Record<string, unknown>;
                return (
                  <>
                    <p><strong>Skills:</strong> {s.key_skills ? (s.key_skills as string[]).join(", ") : "N/A"}</p>
                    <p><strong>Strengths:</strong> {s.strengths ? (s.strengths as string[]).join(", ") : "N/A"}</p>
                    <p><strong>Weaknesses:</strong> {s.weaknesses ? (s.weaknesses as string[]).join(", ") : "N/A"}</p>
                    <p><strong>Recommendation:</strong> {(s.recommendation as string) || "N/A"}</p>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
