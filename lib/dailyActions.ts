import { createClient } from "@/lib/supabase/server";

export interface DailyAction {
  id: string;
  action_type: string;
  title: string;
  description: string | null;
  priority: number;
  completed: boolean;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  action_url?: string;
}

type ActionType =
  | "apply_jobs"
  | "improve_resume"
  | "check_matches"
  | "prep_interview"
  | "update_skills"
  | "review_analytics"
  | "tailor_resume"
  | "explore_salary"
  | "boost_profile"
  | "respond_recruiter"
  | "check_competition";

interface UserContext {
  hasResume: boolean;
  resumeScore: number | null;
  totalApplications: number;
  pendingInterviews: number;
  lastApplyDate: string | null;
  matchesAvailable: number;
  hasUnreadPushes: number;
  daysSinceLastActivity: number;
  currentStreak: number;
}

/**
 * Generate personalized daily action items for a user.
 * Uses pure JS logic — no AI cost.
 */
export async function generateDailyActions(userId: string): Promise<DailyAction[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Check if actions already generated today
  const { data: existing } = await supabase
    .from("daily_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("action_date", today)
    .order("priority", { ascending: false });

  if (existing && existing.length > 0) {
    return existing.map(mapAction);
  }

  // Gather user context for personalization
  const ctx = await gatherUserContext(supabase, userId);
  const actions = buildActions(ctx);

  // Insert actions
  const inserts = actions.map((a) => ({
    user_id: userId,
    action_date: today,
    action_type: a.action_type,
    title: a.title,
    description: a.description,
    priority: a.priority,
    metadata: a.metadata || {},
  }));

  if (inserts.length > 0) {
    const { data: inserted } = await supabase
      .from("daily_actions")
      .insert(inserts)
      .select();

    return (inserted || []).map(mapAction);
  }

  return [];
}

async function gatherUserContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserContext> {
  // Step 1: Get resume IDs (needed for analysis query)
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id")
    .eq("user_id", userId)
    .limit(1);

  const resumeIds = (resumes || []).map((r) => r.id);

  // Step 2: Run ALL remaining queries in parallel
  const [
    analysisResult,
    { count: appCount },
    { count: interviewCount },
    { data: lastRun },
    { count: matchCount },
    { count: pushCount },
    { data: streak },
  ] = await Promise.all([
    resumeIds.length > 0
      ? supabase
          .from("resume_analysis")
          .select("score")
          .in("resume_id", resumeIds)
          .order("created_at", { ascending: false })
          .limit(1)
      : Promise.resolve({ data: null }),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "interviewing"),
    supabase
      .from("auto_apply_runs")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("job_matches")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("match_score", 70),
    supabase
      .from("recruiter_pushes")
      .select("*", { count: "exact", head: true })
      .eq("candidate_id", userId)
      .eq("read", false),
    supabase
      .from("user_streaks")
      .select("current_streak, last_active_date")
      .eq("user_id", userId)
      .single(),
  ]);

  const analysis = analysisResult.data;

  let daysSince = 0;
  if (streak?.last_active_date) {
    const last = new Date(streak.last_active_date);
    daysSince = Math.floor((Date.now() - last.getTime()) / (24 * 60 * 60 * 1000));
  }

  return {
    hasResume: (resumes?.length || 0) > 0,
    resumeScore: analysis?.[0]?.score ?? null,
    totalApplications: appCount || 0,
    pendingInterviews: interviewCount || 0,
    lastApplyDate: lastRun?.[0]?.created_at || null,
    matchesAvailable: matchCount || 0,
    hasUnreadPushes: pushCount || 0,
    daysSinceLastActivity: daysSince,
    currentStreak: streak?.current_streak || 0,
  };
}

function buildActions(ctx: UserContext): Array<{
  action_type: ActionType;
  title: string;
  description: string;
  priority: number;
  metadata?: Record<string, unknown>;
}> {
  const actions: Array<{
    action_type: ActionType;
    title: string;
    description: string;
    priority: number;
    metadata?: Record<string, unknown>;
  }> = [];

  // Priority 2 (urgent) actions
  if (ctx.hasUnreadPushes > 0) {
    actions.push({
      action_type: "respond_recruiter",
      title: `Respond to ${ctx.hasUnreadPushes} recruiter message${ctx.hasUnreadPushes > 1 ? "s" : ""}`,
      description: "Recruiters are interested in you! Responding quickly increases your chances.",
      priority: 2,
      metadata: { count: ctx.hasUnreadPushes },
    });
  }

  if (ctx.pendingInterviews > 0) {
    actions.push({
      action_type: "prep_interview",
      title: `Prepare for ${ctx.pendingInterviews} upcoming interview${ctx.pendingInterviews > 1 ? "s" : ""}`,
      description: "Use AI Interview Prep to practice common questions for your role.",
      priority: 2,
      metadata: { count: ctx.pendingInterviews },
    });
  }

  // Priority 1 (high) actions
  if (!ctx.hasResume) {
    actions.push({
      action_type: "improve_resume",
      title: "Upload your resume",
      description: "Upload your resume to unlock AI analysis, job matching, and auto-apply.",
      priority: 1,
    });
  } else if (ctx.resumeScore !== null && ctx.resumeScore < 70) {
    actions.push({
      action_type: "improve_resume",
      title: "Improve your resume score",
      description: `Your ATS score is ${ctx.resumeScore}%. Aim for 80%+ to get more interviews.`,
      priority: 1,
      metadata: { current_score: ctx.resumeScore },
    });
  }

  if (ctx.matchesAvailable > 0) {
    actions.push({
      action_type: "check_matches",
      title: `Review ${ctx.matchesAvailable} high-match jobs`,
      description: "You have jobs with 70%+ match score waiting. Review and apply today.",
      priority: 1,
      metadata: { count: ctx.matchesAvailable },
    });
  }

  // Determine optimal daily apply count
  const optimalApplies = ctx.totalApplications < 20 ? 5 : ctx.totalApplications < 50 ? 3 : 2;
  const daysSinceApply = ctx.lastApplyDate
    ? Math.floor((Date.now() - new Date(ctx.lastApplyDate).getTime()) / (24 * 60 * 60 * 1000))
    : 999;

  if (daysSinceApply >= 1) {
    actions.push({
      action_type: "apply_jobs",
      title: `Apply to ${optimalApplies} jobs today`,
      description: daysSinceApply > 3
        ? "You haven't applied in a few days. Momentum matters — apply today!"
        : "Consistent applying is the #1 factor in landing interviews faster.",
      priority: daysSinceApply > 3 ? 1 : 0,
      metadata: { target: optimalApplies, days_since: daysSinceApply },
    });
  }

  // Priority 0 (normal) actions
  if (ctx.totalApplications >= 5) {
    actions.push({
      action_type: "review_analytics",
      title: "Check your career analytics",
      description: "Review your application trends and interview rates to optimize your strategy.",
      priority: 0,
    });
  }

  if (ctx.totalApplications >= 10 && ctx.resumeScore !== null && ctx.resumeScore >= 70) {
    actions.push({
      action_type: "check_competition",
      title: "Check your competitive ranking",
      description: "See how you rank against other candidates applying for similar roles.",
      priority: 0,
    });
  }

  if (ctx.currentStreak >= 3) {
    actions.push({
      action_type: "explore_salary",
      title: "Explore salary benchmarks",
      description: `${ctx.currentStreak}-day streak! Reward yourself with market salary insights for your role.`,
      priority: 0,
    });
  }

  // Always show at least 3 actions
  if (actions.length < 3) {
    if (!actions.find((a) => a.action_type === "tailor_resume")) {
      actions.push({
        action_type: "tailor_resume",
        title: "Tailor your resume for a specific job",
        description: "A tailored resume gets 3x more interviews than a generic one.",
        priority: 0,
      });
    }
  }

  // Cap at 5 actions, sorted by priority desc
  return actions.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

/**
 * Mark a daily action as completed. Awards streak progress.
 */
export async function completeDailyAction(
  userId: string,
  actionId: string
): Promise<{ completed: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("daily_actions")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", actionId)
    .eq("user_id", userId);

  return { completed: !error };
}

/**
 * Get completion stats for today.
 */
export async function getDailyProgress(
  userId: string
): Promise<{ total: number; completed: number; percentage: number }> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_actions")
    .select("completed")
    .eq("user_id", userId)
    .eq("action_date", today);

  const total = data?.length || 0;
  const completed = data?.filter((d) => d.completed).length || 0;

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function mapAction(row: Record<string, unknown>): DailyAction {
  const type = row.action_type as string;
  const urlMap: Record<string, string> = {
    apply_jobs: "/auto-apply",
    improve_resume: "/resume-analyzer",
    check_matches: "/job-match",
    prep_interview: "/interview-prep",
    update_skills: "/settings",
    review_analytics: "/analytics",
    tailor_resume: "/tailor-resume",
    explore_salary: "/salary-insights",
    boost_profile: "/pricing",
    respond_recruiter: "/dashboard",
    check_competition: "/resume-performance",
  };

  return {
    id: row.id as string,
    action_type: type,
    title: row.title as string,
    description: row.description as string | null,
    priority: row.priority as number,
    completed: row.completed as boolean,
    completed_at: row.completed_at as string | null,
    metadata: (row.metadata || {}) as Record<string, unknown>,
    action_url: urlMap[type] || "/dashboard",
  };
}
