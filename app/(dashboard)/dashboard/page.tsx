import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { getUsageSummary } from "@/lib/usage";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { UsageCard } from "@/components/dashboard/UsageCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ActivityList } from "@/components/dashboard/ActivityList";

export default async function DashboardPage() {
  const user = await getUser();
  const planType = user?.profile?.plan_type ?? "free";
  const usage = await getUsageSummary(user!.id, planType);

  const supabase = await createClient();
  const { data: analyses } = await supabase
    .from("resume_analysis")
    .select("id, score, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: matches } = await supabase
    .from("job_matches")
    .select("id, match_score, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const latestScore = analyses?.[0]?.score ?? null;
  const activityItems = [
    ...(analyses?.map((a) => ({
      id: a.id,
      type: "resume_analysis" as const,
      title: "Resume analyzed",
      subtitle: `Score ${a.score}%`,
      date: new Date(a.created_at).toLocaleDateString(),
    })) ?? []),
    ...(matches?.map((m) => ({
      id: m.id,
      type: "job_match" as const,
      title: "Job match",
      subtitle: `Match ${m.match_score}%`,
      date: new Date(m.created_at).toLocaleDateString(),
    })) ?? []),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">
        Welcome back{user?.profile?.email ? `, ${user.profile.email.split("@")[0]}` : ""} 👋
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <ScoreCard score={latestScore} />
        <UsageCard
          resume={usage.resume_analysis}
          jobMatch={usage.job_match}
          coverLetter={usage.cover_letter}
          isPro={planType === "pro"}
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-text">Quick Actions</h2>
        <QuickActions />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-text">Recent Activity</h2>
        <ActivityList items={activityItems} />
      </div>
    </div>
  );
}
