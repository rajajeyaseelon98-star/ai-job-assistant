import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getUsageSummary } from "@/lib/usage";
import { redirect } from "next/navigation";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { JobMatchAvgCard } from "@/components/dashboard/JobMatchAvgCard";
import { UsageCard } from "@/components/dashboard/UsageCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { StreakWidget } from "@/components/dashboard/StreakWidget";
import { DailyActions } from "@/components/dashboard/DailyActions";
import { OpportunityAlerts } from "@/components/dashboard/OpportunityAlerts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const planType = user.profile?.plan_type ?? "free";
  const usage = await getUsageSummary(user.id, planType);

  const supabase = await createClient();
  const { data: analyses } = await supabase
    .from("resume_analysis")
    .select("id, score, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: matches } = await supabase
    .from("job_matches")
    .select("id, match_score, job_title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: coverLetters } = await supabase
    .from("cover_letters")
    .select("id, company_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: avgRow } = await supabase
    .from("job_matches")
    .select("match_score")
    .eq("user_id", user.id)
    .limit(1000);
  const matchScores = (avgRow ?? []).map((r) => r.match_score).filter((n) => typeof n === "number");
  const avgMatchScore = matchScores.length > 0
    ? matchScores.reduce((a, b) => a + b, 0) / matchScores.length
    : null;

  const latestScore = analyses?.[0]?.score ?? null;
  const activityItems = [
    ...(analyses?.map((a) => ({
      id: a.id,
      type: "resume_analysis" as const,
      title: "Resume analyzed",
      subtitle: `Score ${a.score}%`,
      date: new Date(a.created_at).toLocaleDateString(),
      _sortDate: a.created_at,
    })) ?? []),
    ...(matches?.map((m) => ({
      id: m.id,
      type: "job_match" as const,
      title: "Job match",
      subtitle: m.job_title ? `${m.job_title} ${m.match_score}%` : `Match ${m.match_score}%`,
      date: new Date(m.created_at).toLocaleDateString(),
      _sortDate: m.created_at,
    })) ?? []),
    ...(coverLetters?.map((c) => ({
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

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">
        Welcome back{user?.profile?.name ? `, ${user.profile.name}` : user?.profile?.email ? `, ${user.profile.email.split("@")[0]}` : ""} 👋
      </h1>

      {/* Streak + Score Cards Row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 md:gap-6">
        <StreakWidget />
        <ScoreCard score={latestScore} />
        <JobMatchAvgCard avgScore={avgMatchScore} />
        <UsageCard
          resume={usage.resume_analysis}
          jobMatch={usage.job_match}
          coverLetter={usage.cover_letter}
          isPro={planType === "pro" || planType === "premium"}
        />
      </div>

      {/* Opportunity Alerts */}
      <OpportunityAlerts />

      {/* Daily Action Plan */}
      <DailyActions />

      <div>
        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Quick Actions</h2>
        <QuickActions />
      </div>

      <div>
        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-text">Recent Activity</h2>
        <ActivityList items={activityItems} />
      </div>
    </div>
  );
}
