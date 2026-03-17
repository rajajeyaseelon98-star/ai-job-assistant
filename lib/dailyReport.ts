import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export interface DailyReport {
  period: string; // "today" or date
  new_jobs_found: number;
  auto_applied: number;
  interviews_scheduled: number;
  responses_received: number;
  match_score_avg: number | null;
  top_matches: Array<{ title: string; company: string; score: number }>;
  action_items: string[];
}

/**
 * Generate a daily report for a user based on recent activity.
 */
export async function generateDailyReport(
  userId: string
): Promise<DailyReport> {
  const supabase = await createClient();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayStr = today.toISOString().split("T")[0];
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // 1. Auto-apply runs from last 24h
  const { data: runs } = await supabase
    .from("auto_apply_runs")
    .select("results, jobs_found, jobs_matched, jobs_applied, status")
    .eq("user_id", userId)
    .gte("created_at", yesterday.toISOString())
    .order("created_at", { ascending: false });

  let newJobsFound = 0;
  let autoApplied = 0;
  let matchScoreSum = 0;
  let matchCount = 0;
  const topMatches: Array<{ title: string; company: string; score: number }> = [];

  for (const run of runs || []) {
    newJobsFound += run.jobs_found || 0;
    autoApplied += run.jobs_applied || 0;

    const results = (run.results || []) as Array<{
      title: string;
      company: string;
      match_score: number;
    }>;
    for (const r of results) {
      matchScoreSum += r.match_score;
      matchCount++;
      if (topMatches.length < 5 && r.match_score >= 70) {
        topMatches.push({ title: r.title, company: r.company, score: r.match_score });
      }
    }
  }

  // 2. Applications status changes (interviews scheduled)
  const { data: interviewApps } = await supabase
    .from("applications")
    .select("role, company")
    .eq("user_id", userId)
    .eq("status", "interviewing")
    .gte("updated_at", yesterday.toISOString());

  const interviewsScheduled = interviewApps?.length || 0;

  // 3. Responses received (status changed from applied)
  const { data: responseApps } = await supabase
    .from("applications")
    .select("status")
    .eq("user_id", userId)
    .in("status", ["interviewing", "offer", "rejected"])
    .gte("updated_at", yesterday.toISOString());

  const responsesReceived = responseApps?.length || 0;

  // 4. Generate action items
  const actionItems: string[] = [];

  if (newJobsFound > 0 && autoApplied === 0) {
    actionItems.push(`${newJobsFound} new jobs found — review and apply in Auto-Apply`);
  }
  if (interviewsScheduled > 0) {
    actionItems.push(`${interviewsScheduled} interview${interviewsScheduled > 1 ? "s" : ""} scheduled — prepare with Interview Prep`);
  }
  if (responsesReceived === 0 && autoApplied > 0) {
    actionItems.push("No responses yet — consider tailoring your resume for better results");
  }
  if (autoApplied > 3) {
    actionItems.push("Great momentum! Keep tracking outcomes in Applications");
  }
  if (topMatches.length > 0) {
    actionItems.push(`Strong match: ${topMatches[0].title} at ${topMatches[0].company} (${topMatches[0].score}%)`);
  }
  if (actionItems.length === 0) {
    actionItems.push("Run Auto-Apply or Smart Auto-Apply to find new opportunities");
  }

  return {
    period: todayStr,
    new_jobs_found: newJobsFound,
    auto_applied: autoApplied,
    interviews_scheduled: interviewsScheduled,
    responses_received: responsesReceived,
    match_score_avg: matchCount > 0 ? Math.round(matchScoreSum / matchCount) : null,
    top_matches: topMatches,
    action_items: actionItems.slice(0, 5),
  };
}

/**
 * Send daily report as notification.
 * Called from cron alongside smart-apply trigger.
 */
export async function sendDailyReportNotification(userId: string): Promise<void> {
  try {
    const report = await generateDailyReport(userId);

    // Only send if there's something to report
    if (report.new_jobs_found === 0 && report.auto_applied === 0 && report.responses_received === 0) {
      return;
    }

    const parts: string[] = [];
    if (report.new_jobs_found > 0) parts.push(`${report.new_jobs_found} new jobs found`);
    if (report.auto_applied > 0) parts.push(`${report.auto_applied} applied`);
    if (report.interviews_scheduled > 0) parts.push(`${report.interviews_scheduled} interviews`);
    if (report.responses_received > 0) parts.push(`${report.responses_received} responses`);

    await createNotification(
      userId,
      "info",
      "Daily Career Report",
      parts.join(" • ") + ". " + report.action_items[0],
      { report }
    );
  } catch {
    // Non-critical
  }
}
