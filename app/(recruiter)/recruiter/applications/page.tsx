"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, Brain, ChevronDown, ChevronUp } from "lucide-react";
import type { JobApplication, ApplicationStage } from "@/types/recruiter";
import { STAGE_LABELS, STAGE_COLORS } from "@/types/recruiter";

const PIPELINE_STAGES: ApplicationStage[] = [
  "applied", "shortlisted", "interview_scheduled", "interviewed", "offer_sent", "hired", "rejected",
];

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
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-4 -mx-1 px-1">
          {PIPELINE_STAGES.map((stage) => {
            const stageApps = apps.filter((a) => a.stage === stage);
            return (
              <div key={stage} className="min-w-[180px] sm:min-w-[200px] flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[stage]}`}>
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-xs text-text-muted">{stageApps.length}</span>
                </div>
                <div className="space-y-2 rounded-lg bg-gray-50 p-2 min-h-[100px]">
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
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-text truncate">
            {(candidate?.name as string) || (candidate?.email as string) || "Candidate"}
          </h4>
          <p className="text-xs text-text-muted truncate">{(job?.title as string) || "Job"}</p>
        </div>
        {app.match_score !== null && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
            app.match_score >= 80 ? "bg-green-100 text-green-700" :
            app.match_score >= 60 ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}>
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
        <p className="mt-2 text-xs text-text-muted italic">{app.ai_summary}</p>
      )}

      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => onScreen(app.id)}
          disabled={screeningId === app.id}
          className="flex items-center gap-1 rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 hover:bg-purple-200 active:bg-purple-300 disabled:opacity-50 min-h-[36px] sm:min-h-0"
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
