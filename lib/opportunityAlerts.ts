import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export interface OpportunityAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  urgency: string;
  action_url: string | null;
  metadata: Record<string, unknown>;
  seen: boolean;
  dismissed: boolean;
  expires_at: string | null;
  created_at: string;
}

/**
 * Get active (non-dismissed, non-expired) alerts for a user.
 */
export async function getActiveAlerts(
  userId: string,
  limit = 10
): Promise<OpportunityAlert[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("opportunity_alerts")
    .select("*")
    .eq("user_id", userId)
    .eq("dismissed", false)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as OpportunityAlert[];
}

/**
 * Dismiss an alert.
 */
export async function dismissAlert(
  userId: string,
  alertId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("opportunity_alerts")
    .update({ dismissed: true })
    .eq("id", alertId)
    .eq("user_id", userId);
}

/**
 * Mark alert as seen (read).
 */
export async function markAlertSeen(
  userId: string,
  alertId: string
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("opportunity_alerts")
    .update({ seen: true })
    .eq("id", alertId)
    .eq("user_id", userId);
}

/**
 * Create a high-match job alert.
 * Called when auto-apply or job finder discovers a very high-match job.
 */
export async function createHighMatchAlert(
  userId: string,
  jobTitle: string,
  company: string,
  matchScore: number,
  jobUrl?: string,
  jobId?: string
): Promise<void> {
  if (matchScore < 85) return; // Only alert for 85%+ matches

  const supabase = await createClient();

  // Dedup: don't alert same job twice
  if (jobId) {
    const { count } = await supabase
      .from("opportunity_alerts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("alert_type", "high_match_job")
      .contains("metadata", { job_id: jobId });

    if (count && count > 0) return;
  }

  const urgency = matchScore >= 95 ? "urgent" : matchScore >= 90 ? "high" : "normal";
  const expires = new Date();
  expires.setDate(expires.getDate() + 3); // 3-day window

  await supabase.from("opportunity_alerts").insert({
    user_id: userId,
    alert_type: "high_match_job",
    title: `${matchScore}% match: ${jobTitle}`,
    message: `${company} is hiring for ${jobTitle} — this is one of your best matches. Apply quickly before competition increases.`,
    urgency,
    action_url: jobUrl || "/auto-apply",
    metadata: { job_title: jobTitle, company, match_score: matchScore, job_id: jobId },
    expires_at: expires.toISOString(),
  });

  // Also send a notification
  await createNotification(
    userId,
    "success",
    `🎯 ${matchScore}% Match Found!`,
    `${jobTitle} at ${company} — high chance of interview. Apply now!`,
    { job_title: jobTitle, company, match_score: matchScore }
  ).catch(() => {});
}

/**
 * Create a low-competition alert.
 * Called when a job has fewer applicants than average.
 */
export async function createLowCompetitionAlert(
  userId: string,
  jobTitle: string,
  company: string,
  applicantCount: number,
  avgApplicants: number
): Promise<void> {
  if (applicantCount >= avgApplicants * 0.5) return; // Only alert if <50% of average

  const supabase = await createClient();
  const expires = new Date();
  expires.setDate(expires.getDate() + 2);

  await supabase.from("opportunity_alerts").insert({
    user_id: userId,
    alert_type: "low_competition",
    title: `Low competition: ${jobTitle}`,
    message: `Only ${applicantCount} applicants (avg: ${avgApplicants}). ${company} — apply now for higher chances.`,
    urgency: "high",
    action_url: "/auto-apply",
    metadata: { job_title: jobTitle, company, applicants: applicantCount, avg: avgApplicants },
    expires_at: expires.toISOString(),
  });
}

/**
 * Create a recruiter interest alert.
 */
export async function createRecruiterInterestAlert(
  userId: string,
  recruiterName: string,
  action: string,
  jobTitle?: string
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("opportunity_alerts").insert({
    user_id: userId,
    alert_type: "recruiter_interest",
    title: `Recruiter ${action}`,
    message: `${recruiterName} ${action}${jobTitle ? ` for ${jobTitle}` : ""}. Respond quickly!`,
    urgency: "high",
    action_url: "/dashboard",
    metadata: { recruiter_name: recruiterName, action, job_title: jobTitle },
  });
}

/**
 * Scan and generate opportunity alerts for a user.
 * Called from cron or on dashboard load.
 */
export async function scanOpportunities(userId: string): Promise<number> {
  const supabase = await createClient();
  let alertsCreated = 0;

  // 1. Check for high-match jobs from recent auto-apply runs
  const { data: recentRuns } = await supabase
    .from("auto_apply_runs")
    .select("results")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  for (const run of recentRuns || []) {
    const results = (run.results || []) as Array<{
      title: string;
      company: string;
      match_score: number;
      job_id?: string;
      url?: string;
    }>;
    for (const r of results) {
      if (r.match_score >= 85) {
        await createHighMatchAlert(userId, r.title, r.company, r.match_score, r.url, r.job_id);
        alertsCreated++;
      }
    }
  }

  // 2. Check for unresponded recruiter pushes (>24h old)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: oldPushes } = await supabase
    .from("recruiter_pushes")
    .select("*", { count: "exact", head: true })
    .eq("candidate_id", userId)
    .eq("read", false)
    .lt("created_at", yesterday);

  if (oldPushes && oldPushes > 0) {
    const { count: existingAlert } = await supabase
      .from("opportunity_alerts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("alert_type", "recruiter_interest")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!existingAlert || existingAlert === 0) {
      await supabase.from("opportunity_alerts").insert({
        user_id: userId,
        alert_type: "recruiter_interest",
        title: `${oldPushes} recruiter message${oldPushes > 1 ? "s" : ""} waiting`,
        message: "Recruiters reached out to you. Quick responses get 2x more interview invites.",
        urgency: "urgent",
        action_url: "/dashboard",
        metadata: { count: oldPushes },
      });
      alertsCreated++;
    }
  }

  return alertsCreated;
}
