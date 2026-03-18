import { NextResponse } from "next/server";
import { runAllSmartRules } from "@/lib/smartApplyEngine";
import { sendDailyReportNotification } from "@/lib/dailyReport";
import { refreshPlatformStats } from "@/lib/socialProof";
import { refreshSkillDemand } from "@/lib/skillDemand";
import { runDailyRecruiterAutoPush } from "@/lib/recruiterAutoPush";
import { scanOpportunities } from "@/lib/opportunityAlerts";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/smart-apply/trigger
 * Unified cron endpoint:
 * 1. Smart apply execution for all active rules
 * 2. Daily report notifications
 * 3. Platform stats refresh (social proof)
 * 4. Skill demand data refresh (data moat)
 *
 * Protected by CRON_SECRET header in production.
 * In development, accessible without secret.
 */
export async function POST(request: Request) {
  // Verify cron secret in production
  if (process.env.NODE_ENV === "production") {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    // 1. Run all smart apply rules
    const result = await runAllSmartRules();

    // 2. Send daily reports to active users (non-blocking)
    let reportsSent = 0;
    try {
      const supabase = await createClient();
      const { data: activeUsers } = await supabase
        .from("auto_apply_runs")
        .select("user_id")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const uniqueUserIds = [...new Set((activeUsers || []).map((u) => u.user_id))];

      for (const userId of uniqueUserIds.slice(0, 100)) {
        await sendDailyReportNotification(userId);
        reportsSent++;
      }
    } catch (err) {
      console.error("Daily report error:", err);
    }

    // 3. Refresh platform stats (social proof)
    let platformStatsRefreshed = false;
    try {
      await refreshPlatformStats();
      platformStatsRefreshed = true;
    } catch (err) {
      console.error("Platform stats refresh error:", err);
    }

    // 4. Refresh skill demand data
    let skillDemandResult = { processed: 0 };
    try {
      skillDemandResult = await refreshSkillDemand();
    } catch (err) {
      console.error("Skill demand refresh error:", err);
    }

    // 5. Recruiter auto-push (match candidates to active jobs)
    let recruiterPushResult = { jobs_processed: 0, total_pushed: 0 };
    try {
      recruiterPushResult = await runDailyRecruiterAutoPush();
    } catch (err) {
      console.error("Recruiter auto-push error:", err);
    }

    // 6. Scan opportunity alerts for active users
    let alertsScanned = 0;
    try {
      const supabase2 = await createClient();
      const { data: recentUsers } = await supabase2
        .from("user_streaks")
        .select("user_id")
        .gte("last_active_date", new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .limit(200);

      for (const u of recentUsers || []) {
        await scanOpportunities(u.user_id).catch(() => {});
        alertsScanned++;
      }
    } catch (err) {
      console.error("Opportunity alerts scan error:", err);
    }

    // 7. Cleanup stale rate_limit entries (older than 5 minutes) to prevent table bloat
    let rateLimitCleaned = false;
    try {
      const supabaseCleanup = await createClient();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabaseCleanup
        .from("usage_logs")
        .delete()
        .eq("feature", "rate_limit")
        .lt("timestamp", fiveMinutesAgo);
      rateLimitCleaned = true;
    } catch (err) {
      console.error("Rate limit cleanup error:", err);
    }

    // 8. Cleanup expired AI cache entries
    let cacheEntriesCleaned = false;
    try {
      const supabaseCache = await createClient();
      await supabaseCache
        .from("ai_cache")
        .delete()
        .lt("expires_at", new Date().toISOString());
      cacheEntriesCleaned = true;
    } catch (err) {
      console.error("AI cache cleanup error:", err);
    }

    return NextResponse.json({
      success: true,
      smart_apply: {
        processed: result.processed,
        total_applied: result.total_applied,
        errors: result.errors,
      },
      daily_reports: {
        sent: reportsSent,
      },
      platform_stats: {
        refreshed: platformStatsRefreshed,
      },
      skill_demand: {
        skills_processed: skillDemandResult.processed,
      },
      recruiter_auto_push: {
        jobs_processed: recruiterPushResult.jobs_processed,
        candidates_pushed: recruiterPushResult.total_pushed,
      },
      opportunity_alerts: {
        users_scanned: alertsScanned,
      },
      cleanup: {
        rate_limit_cleaned: rateLimitCleaned,
        cache_cleaned: cacheEntriesCleaned,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Smart apply trigger error:", err);
    return NextResponse.json(
      { error: "Internal error", message: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
