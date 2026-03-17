import { createClient } from "@/lib/supabase/server";
import { runAutoApply } from "@/lib/autoApplyEngine";
import { createNotification } from "@/lib/notifications";
import type { SmartApplyRule, AutoApplyConfig } from "@/types/autoApply";

/**
 * Smart Auto-Apply Engine
 * Checks user-defined rules and triggers auto-apply runs automatically.
 * Designed to be called from a cron/scheduled job or API trigger.
 */

const SMART_APPLY_COOLDOWN_HOURS = 24; // Minimum hours between runs

export async function getActiveSmartRules(): Promise<SmartApplyRule[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("smart_apply_rules")
    .select("*")
    .eq("enabled", true)
    .or(`next_run_at.is.null,next_run_at.lte.${now}`);

  if (error || !data) return [];
  return data as SmartApplyRule[];
}

/**
 * Execute a single smart apply rule.
 * Creates an auto-apply run with the rule's config, then
 * auto-confirms jobs that meet the threshold.
 */
export async function executeSmartRule(rule: SmartApplyRule): Promise<{
  success: boolean;
  jobs_applied: number;
  error?: string;
}> {
  const supabase = await createClient();

  try {
    // Check daily/weekly limits
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Count today's applications
    const { count: todayCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", rule.user_id)
      .gte("applied_date", todayStart.toISOString().split("T")[0]);

    if ((todayCount ?? 0) >= rule.rules.max_applications_per_day) {
      return { success: true, jobs_applied: 0, error: "Daily application limit reached" };
    }

    // Count this week's applications
    const { count: weekCount } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", rule.user_id)
      .gte("applied_date", weekStart.toISOString().split("T")[0]);

    if ((weekCount ?? 0) >= rule.rules.max_applications_per_week) {
      return { success: true, jobs_applied: 0, error: "Weekly application limit reached" };
    }

    const remainingToday = rule.rules.max_applications_per_day - (todayCount ?? 0);
    const remainingWeek = rule.rules.max_applications_per_week - (weekCount ?? 0);
    const maxToApply = Math.min(remainingToday, remainingWeek, 10);

    if (maxToApply <= 0) {
      return { success: true, jobs_applied: 0 };
    }

    // Build auto-apply config from smart rules
    const config: AutoApplyConfig = {
      resume_id: rule.resume_id,
      location: rule.rules.preferred_locations?.[0] || undefined,
      preferred_roles: rule.rules.preferred_roles,
      min_salary: rule.rules.min_salary,
      max_results: maxToApply,
    };

    // Create run record
    const { data: run, error: runError } = await supabase
      .from("auto_apply_runs")
      .insert({
        user_id: rule.user_id,
        resume_id: config.resume_id,
        status: "pending",
        config,
      })
      .select("id")
      .single();

    if (runError || !run) {
      return { success: false, jobs_applied: 0, error: "Failed to create run" };
    }

    // Run the auto-apply engine (synchronous in smart mode)
    await runAutoApply(run.id, rule.user_id, config);

    // Fetch the results
    const { data: completedRun } = await supabase
      .from("auto_apply_runs")
      .select("results, status")
      .eq("id", run.id)
      .single();

    if (!completedRun || completedRun.status === "failed") {
      return { success: false, jobs_applied: 0, error: "Auto-apply run failed" };
    }

    const results = (completedRun.results || []) as Array<{
      job_id: string;
      match_score: number;
      salary_min?: number;
      salary_max?: number;
      location?: string;
      title: string;
      company: string;
      url?: string;
      source: string;
      match_reason: string;
      selected: boolean;
      applied: boolean;
    }>;

    // Auto-select jobs that meet the smart rules threshold
    const qualifyingJobs = results.filter((job) => {
      if (job.match_score < rule.rules.min_match_score) return false;

      // Salary check
      if (rule.rules.min_salary && job.salary_max && job.salary_max < rule.rules.min_salary) return false;
      if (rule.rules.max_salary && job.salary_min && job.salary_min > rule.rules.max_salary) return false;

      // Location check
      if (rule.rules.preferred_locations.length > 0) {
        const jobLoc = (job.location || "").toLowerCase();
        const locationMatch = rule.rules.preferred_locations.some(
          (loc) => jobLoc.includes(loc.toLowerCase())
        );
        if (!locationMatch && !(rule.rules.include_remote && jobLoc.includes("remote"))) {
          return false;
        }
      }

      return true;
    });

    if (qualifyingJobs.length === 0) {
      // Update run as completed with no applications
      await supabase
        .from("auto_apply_runs")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", run.id);

      // Update rule next run time
      const nextRun = new Date();
      nextRun.setHours(nextRun.getHours() + SMART_APPLY_COOLDOWN_HOURS);
      await supabase
        .from("smart_apply_rules")
        .update({
          last_run_at: new Date().toISOString(),
          next_run_at: nextRun.toISOString(),
          total_runs: rule.total_runs + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rule.id);

      return { success: true, jobs_applied: 0 };
    }

    // Mark qualifying jobs as selected
    const selectedIds = new Set(qualifyingJobs.map((j) => j.job_id));
    const updatedResults = results.map((r) => ({
      ...r,
      selected: selectedIds.has(r.job_id),
    }));

    await supabase
      .from("auto_apply_runs")
      .update({
        results: updatedResults,
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    // Auto-confirm: create application records
    let appliedCount = 0;
    const today = new Date().toISOString().split("T")[0];

    for (const job of qualifyingJobs) {
      const { error: insertError } = await supabase.from("applications").insert({
        user_id: rule.user_id,
        role: job.title,
        company: job.company,
        status: "applied",
        url: job.url || null,
        notes: `Smart Auto-Applied (${job.source}).\nMatch: ${job.match_score}%\n${job.match_reason}`,
        applied_date: today,
      });
      if (!insertError) appliedCount++;
    }

    // Update run as completed
    await supabase
      .from("auto_apply_runs")
      .update({
        status: "completed",
        jobs_applied: appliedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    // Update rule
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + SMART_APPLY_COOLDOWN_HOURS);
    await supabase
      .from("smart_apply_rules")
      .update({
        last_run_at: new Date().toISOString(),
        next_run_at: nextRun.toISOString(),
        total_runs: rule.total_runs + 1,
        total_applied: rule.total_applied + appliedCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rule.id);

    // Notify user
    if (appliedCount > 0) {
      await createNotification(
        rule.user_id,
        "auto_apply",
        "Smart Auto-Apply Applied!",
        `Automatically applied to ${appliedCount} job${appliedCount !== 1 ? "s" : ""} matching your rules. Check Applications for details.`,
        { rule_id: rule.id, run_id: run.id, applied_count: appliedCount }
      );
    }

    return { success: true, jobs_applied: appliedCount };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, jobs_applied: 0, error: message };
  }
}

/**
 * Run all active smart apply rules. Called from cron or API.
 */
export async function runAllSmartRules(): Promise<{
  processed: number;
  total_applied: number;
  errors: string[];
}> {
  const rules = await getActiveSmartRules();
  let totalApplied = 0;
  const errors: string[] = [];

  for (const rule of rules) {
    const result = await executeSmartRule(rule);
    totalApplied += result.jobs_applied;
    if (!result.success && result.error) {
      errors.push(`Rule ${rule.id}: ${result.error}`);
    }
  }

  return { processed: rules.length, total_applied: totalApplied, errors };
}
