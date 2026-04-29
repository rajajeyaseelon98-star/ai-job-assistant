"use client";

import { Suspense, useMemo, lazy } from "react";
import { useDashboardStats } from "@/hooks/queries/use-dashboard";
import { FREE_PLAN_LIMITS } from "@/lib/usage-limits";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { JobMatchAvgCard } from "@/components/dashboard/JobMatchAvgCard";
import { UsageCard } from "@/components/dashboard/UsageCard";
import { ProductNarrativeBanner } from "@/components/dashboard/ProductNarrativeBanner";
import { StartHereChecklist } from "@/components/dashboard/StartHereChecklist";
import { StartHereActions } from "@/components/dashboard/StartHereActions";
import { ExploreMoreActions } from "@/components/dashboard/ExploreMoreActions";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { CardRowSkeleton, SectionSkeleton, ListSkeleton } from "@/components/ui/SectionSkeleton";

const StreakWidget = lazy(() =>
  import("@/components/dashboard/StreakWidget").then((m) => ({ default: m.StreakWidget }))
);
const DailyActions = lazy(() =>
  import("@/components/dashboard/DailyActions").then((m) => ({ default: m.DailyActions }))
);
const OpportunityAlerts = lazy(() =>
  import("@/components/dashboard/OpportunityAlerts").then((m) => ({ default: m.OpportunityAlerts }))
);

function DashboardHeader({ userName }: { userName: string | null }) {
  const greeting = userName ? `, ${userName}` : "";
  return (
    <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
      Welcome back{greeting} <span aria-hidden>👋</span>
    </h1>
  );
}

function DashboardStats() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) return <CardRowSkeleton />;

  const latestScore = data.analyses?.[0]?.score ?? null;
  const planType = (data.planType ?? "free") as "free" | "pro" | "premium";
  const usage = data.usage as Record<string, { used: number; limit: number }>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      <Suspense fallback={<div className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100/60" />}>
        <StreakWidget />
      </Suspense>
      <ScoreCard score={latestScore} />
      <JobMatchAvgCard avgScore={data.avgMatchScore} />
      <UsageCard
        resume={usage?.resume_analysis ?? { used: 0, limit: FREE_PLAN_LIMITS.resume_analysis }}
        jobMatch={usage?.job_match ?? { used: 0, limit: FREE_PLAN_LIMITS.job_match }}
        coverLetter={usage?.cover_letter ?? { used: 0, limit: FREE_PLAN_LIMITS.cover_letter }}
        isPro={planType === "pro" || planType === "premium"}
      />
    </div>
  );
}

function DashboardChecklist() {
  const { data } = useDashboardStats();
  if (!data) return null;

  const latestScore = data.analyses?.[0]?.score ?? null;
  const hasMatch = (data.matches?.length ?? 0) > 0;
  const hasTrackedApplication = (data.applicationCount ?? 0) > 0;

  return (
    <StartHereChecklist
      hasAtsScore={latestScore !== null}
      hasJobMatch={hasMatch}
      hasTrackedApplication={hasTrackedApplication}
    />
  );
}

function RecentActivity() {
  const { data } = useDashboardStats();

  const activityItems = useMemo(() => {
    if (!data) return [];
    return [
      ...(data.analyses?.map((a) => ({
        id: a.id,
        type: "resume_analysis" as const,
        title: "Resume analyzed",
        subtitle: `Score ${a.score}%`,
        date: new Date(a.created_at).toLocaleDateString(),
        _sortDate: a.created_at,
      })) ?? []),
      ...(data.matches?.map((m) => ({
        id: m.id,
        type: "job_match" as const,
        title: "Job match",
        subtitle: m.job_title ? `${m.job_title} ${m.match_score}%` : `Match ${m.match_score}%`,
        date: new Date(m.created_at).toLocaleDateString(),
        _sortDate: m.created_at,
      })) ?? []),
      ...(data.coverLetters?.map((c) => ({
        id: c.id,
        type: "cover_letter" as const,
        title: "Cover letter generated",
        subtitle: c.company_name || "Cover letter",
        date: new Date(c.created_at).toLocaleDateString(),
        _sortDate: c.created_at,
      })) ?? []),
    ]
      .sort((a, b) => new Date(b._sortDate).getTime() - new Date(a._sortDate).getTime())
      .slice(0, 8);
  }, [data]);

  if (!data) return <ListSkeleton rows={3} />;

  return <ActivityList items={activityItems} />;
}

export default function DashboardPage() {
  const { data } = useDashboardStats();

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6 md:space-y-8">
      <DashboardHeader userName={data?.userName ?? null} />

      <div className="mb-8">
        <ProductNarrativeBanner />
      </div>

      <DashboardChecklist />

      {/* Stats row — each card can load independently */}
      <DashboardStats />

      {/* These sections fetch their own data independently — stream in via Suspense */}
      <Suspense fallback={<SectionSkeleton height="h-32" />}>
        <OpportunityAlerts />
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="h-48" />}>
        <DailyActions />
      </Suspense>

      <section className="rounded-2xl border border-slate-100/80 bg-white/40 p-1 sm:p-0">
        <h2 className="font-display mb-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">Start here</h2>
        <p className="mb-4 max-w-2xl font-sans text-sm leading-relaxed text-slate-500 sm:text-base">
          The shortest path to interviews: score → match → apply.
        </p>
        <StartHereActions />
      </section>

      <section className="rounded-2xl border border-slate-100/80 bg-white/40 p-1 sm:p-0">
        <h2 className="font-display mb-2 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">Explore more</h2>
        <p className="mb-4 max-w-2xl font-sans text-sm leading-relaxed text-slate-500 sm:text-base">
          Optional tools — use after your first resume score or when you need a specific edge.
        </p>
        <ExploreMoreActions />
      </section>

      <section>
        <h2 className="font-display mb-4 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">Recent activity</h2>
        <RecentActivity />
      </section>
    </div>
  );
}
