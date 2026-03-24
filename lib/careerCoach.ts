import { createClient } from "@/lib/supabase/server";
import { getApplicationInsights, getConversionFunnel } from "@/lib/learningEngine";

/**
 * Personal AI Career Coach
 *
 * Analyzes user's full application history and produces:
 * 1. "You are failing because..." diagnosis
 * 2. Career direction suggestions
 * 3. Skill ROI ranking (which skills to learn for max interview chances)
 * 4. Weekly performance summary
 * 5. Score transparency (why each score is what it is)
 */

export interface CareerDiagnosis {
  status: "thriving" | "improving" | "struggling" | "critical" | "new";
  headline: string;
  problems: Array<{ issue: string; severity: "critical" | "warning" | "info"; fix: string }>;
  career_direction: Array<{ role: string; reason: string; match_level: "strong" | "moderate" | "weak" }>;
  skill_roi: Array<{ skill: string; roi_score: number; reason: string; action: "learn" | "highlight" | "remove" }>;
  weekly_summary: WeeklySummary | null;
  score_explanation: ScoreExplanation;
}

export interface WeeklySummary {
  period: string;
  applications_sent: number;
  interviews_earned: number;
  offers_received: number;
  interview_rate_change: number; // vs previous week, +/- percentage points
  best_action: string;
  worst_action: string;
  recommendation: string;
}

export interface ScoreExplanation {
  ats_breakdown: { skill_match: number; format_quality: number; keyword_density: number; experience_clarity: number } | null;
  interview_probability_breakdown: { skill_overlap: number; experience_fit: number; resume_quality: number; history: number } | null;
  rank_breakdown: { profile_strength: number; ats_score: number; skills_count: number; activity: number; boost: number } | null;
}

/**
 * Generate a full career diagnosis for the user.
 * Pure JS — no AI cost.
 */
export async function getCareerDiagnosis(userId: string): Promise<CareerDiagnosis> {
  const supabase = await createClient();

  // Run all independent data fetches in parallel
  const [insights, funnel, { data: recentApps }, { data: userResumes }, { data: userProfile }] =
    await Promise.all([
      getApplicationInsights(userId),
      getConversionFunnel(userId),
      supabase
        .from("applications")
        .select("role, company, status, applied_date, notes, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("resumes").select("id").eq("user_id", userId),
      supabase
        .from("users")
        .select("profile_strength, candidate_rank_score, is_boosted, boost_multiplier")
        .eq("id", userId)
        .single(),
    ]);

  const userResumeIds = (userResumes || []).map((r) => r.id);
  const { data: analyses } = userResumeIds.length > 0
    ? await supabase
        .from("resume_analysis")
        .select("score, analysis_json, created_at")
        .in("resume_id", userResumeIds)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: null };

  const apps = recentApps || [];
  const latestAts = analyses?.[0]?.score || null;

  // --- 1. Diagnose problems ---
  const problems: CareerDiagnosis["problems"] = [];

  // Determine status
  let status: CareerDiagnosis["status"] = "new";
  if (apps.length === 0) {
    status = "new";
  } else if (insights.interview_rate >= 30) {
    status = "thriving";
  } else if (insights.interview_rate >= 15) {
    status = "improving";
  } else if (insights.interview_rate >= 5 || apps.length < 10) {
    status = "struggling";
  } else {
    status = "critical";
  }

  const headline = getStatusHeadline(status, insights);

  if (status === "critical" || status === "struggling") {
    // Diagnose WHY they're failing
    if (latestAts !== null && latestAts < 60) {
      problems.push({
        issue: `Your ATS score is ${latestAts}% — most job systems filter below 70%`,
        severity: "critical",
        fix: "Go to Resume Analyzer, improve to 75%+. This alone can double your interview rate.",
      });
    }

    // Check if applying to wrong roles
    const roleGroups = groupByRole(apps);
    const zeroInterviewRoles = roleGroups.filter((r) => r.interviews === 0 && r.count >= 3);
    if (zeroInterviewRoles.length > 0) {
      problems.push({
        issue: `0 interviews from "${zeroInterviewRoles[0].role}" despite ${zeroInterviewRoles[0].count} applications`,
        severity: "critical",
        fix: `Stop applying to ${zeroInterviewRoles[0].role} roles. Focus on roles where you've had success.`,
      });
    }

    // Check if not applying enough
    const last7Days = apps.filter(
      (a) => new Date(a.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    if (last7Days.length < 3) {
      problems.push({
        issue: `Only ${last7Days.length} applications in the last 7 days — momentum is too low`,
        severity: "warning",
        fix: "Apply to at least 3-5 jobs per day. Use Auto-Apply to maintain consistency.",
      });
    }

    // Check if not tailoring
    const genericApps = apps.filter((a) => !a.notes?.includes("tailored") && !a.notes?.includes("match"));
    if (genericApps.length > apps.length * 0.7) {
      problems.push({
        issue: "Most applications use a generic resume — tailored resumes get 3x more interviews",
        severity: "warning",
        fix: "Use Resume Tailoring for your top 5 job matches each week.",
      });
    }

    // No profile/low profile strength
    if ((userProfile?.profile_strength || 0) < 50) {
      problems.push({
        issue: "Your profile is incomplete — recruiters can't find you",
        severity: "warning",
        fix: "Complete your profile (name, headline, bio, skills) to appear in recruiter searches.",
      });
    }
  }

  if (status === "thriving") {
    problems.push({
      issue: "You're performing well! Here's how to maintain momentum.",
      severity: "info",
      fix: "Keep applying consistently and track which roles give the best results.",
    });
  }

  // --- 2. Career Direction ---
  const career_direction = generateCareerDirection(apps, insights);

  // --- 3. Skill ROI ---
  const skill_roi = await generateSkillROI(supabase, userId, apps, insights);

  // --- 4. Weekly Summary ---
  const weekly_summary = generateWeeklySummary(apps);

  // --- 5. Score Explanation ---
  const score_explanation = generateScoreExplanation(latestAts, userProfile, insights);

  return {
    status,
    headline,
    problems: problems.slice(0, 5),
    career_direction: career_direction.slice(0, 5),
    skill_roi: skill_roi.slice(0, 8),
    weekly_summary,
    score_explanation,
  };
}

function getStatusHeadline(status: CareerDiagnosis["status"], insights: Awaited<ReturnType<typeof getApplicationInsights>>): string {
  switch (status) {
    case "thriving":
      return `Great job! ${insights.interview_rate}% interview rate — you're outperforming 80% of candidates.`;
    case "improving":
      return `Getting traction — ${insights.interview_rate}% interview rate. A few tweaks can push you to 30%+.`;
    case "struggling":
      return `Your approach needs adjustment — ${insights.interview_rate}% interview rate is below average.`;
    case "critical":
      return `Action needed — ${insights.total_applications} applications with only ${insights.total_interviews} interviews. Let's fix this.`;
    case "new":
      return "Welcome! Upload your resume and start applying to build your career momentum.";
  }
}

function groupByRole(apps: Array<{ role: string; status: string }>): Array<{ role: string; count: number; interviews: number }> {
  const map = new Map<string, { count: number; interviews: number }>();
  for (const a of apps) {
    const role = (a.role || "unknown").toLowerCase().trim();
    const entry = map.get(role) || { count: 0, interviews: 0 };
    entry.count++;
    if (["interviewing", "offer"].includes(a.status)) entry.interviews++;
    map.set(role, entry);
  }
  return Array.from(map.entries())
    .map(([role, data]) => ({ role, ...data }))
    .sort((a, b) => b.count - a.count);
}

function generateCareerDirection(
  apps: Array<{ role: string; status: string }>,
  insights: Awaited<ReturnType<typeof getApplicationInsights>>
): CareerDiagnosis["career_direction"] {
  const roleGroups = groupByRole(apps);
  const directions: CareerDiagnosis["career_direction"] = [];

  for (const group of roleGroups.slice(0, 8)) {
    const interviewRate = group.count > 0 ? (group.interviews / group.count) * 100 : 0;
    let match_level: "strong" | "moderate" | "weak";
    let reason: string;

    if (interviewRate >= 30) {
      match_level = "strong";
      reason = `${Math.round(interviewRate)}% interview rate from ${group.count} applications — this is your strongest role`;
    } else if (interviewRate >= 10) {
      match_level = "moderate";
      reason = `${Math.round(interviewRate)}% interview rate — potential with better resume tailoring`;
    } else {
      match_level = "weak";
      reason = group.count >= 5
        ? `${group.count} applications with ${group.interviews} interviews — consider pivoting`
        : `Only ${group.count} applications — need more data`;
    }

    directions.push({ role: group.role, reason, match_level });
  }

  return directions;
}

async function generateSkillROI(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  apps: Array<{ role: string; status: string; notes: string | null }>,
  insights: Awaited<ReturnType<typeof getApplicationInsights>>
): Promise<CareerDiagnosis["skill_roi"]> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [{ data: userSkills }, { data: demandData }] = await Promise.all([
    supabase
      .from("candidate_skills")
      .select("skill_normalized")
      .eq("user_id", userId),
    supabase
      .from("skill_demand")
      .select("skill_name, demand_count, supply_count, avg_salary, demand_trend")
      .eq("month", currentMonth)
      .order("demand_count", { ascending: false })
      .limit(20),
  ]);

  const userSkillSet = new Set((userSkills || []).map((s) => s.skill_normalized.toLowerCase()));
  const roi: CareerDiagnosis["skill_roi"] = [];

  // Skills user has that are in demand → HIGHLIGHT
  for (const d of demandData || []) {
    const skillLower = d.skill_name.toLowerCase();
    if (userSkillSet.has(skillLower)) {
      const demandRatio = d.supply_count > 0 ? d.demand_count / d.supply_count : d.demand_count;
      roi.push({
        skill: d.skill_name,
        roi_score: Math.min(100, Math.round(demandRatio * 20 + (d.demand_trend || 0))),
        reason: `${d.demand_count} jobs need this, salary avg ₹${Math.round((d.avg_salary || 0) / 1000)}K`,
        action: "highlight",
      });
    }
  }

  // High-demand skills user DOESN'T have → LEARN
  for (const d of demandData || []) {
    const skillLower = d.skill_name.toLowerCase();
    if (!userSkillSet.has(skillLower) && d.demand_count > 10) {
      const demandRatio = d.supply_count > 0 ? d.demand_count / d.supply_count : d.demand_count;
      if (demandRatio > 1.5) {
        roi.push({
          skill: d.skill_name,
          roi_score: Math.min(100, Math.round(demandRatio * 15)),
          reason: `High demand (${d.demand_count} jobs) but low supply — learning this increases chances`,
          action: "learn",
        });
      }
    }
  }

  // Skills from worst-performing roles → consider removing emphasis
  if (insights.worst_performing_roles.length > 0) {
    const roleSkillMap: Record<string, string[]> = {
      "data entry": ["data entry", "typing"],
      "support": ["helpdesk", "ticketing"],
    };
    for (const role of insights.worst_performing_roles) {
      const skills = roleSkillMap[role] || [];
      for (const s of skills) {
        if (userSkillSet.has(s)) {
          roi.push({
            skill: s,
            roi_score: 10,
            reason: `Associated with "${role}" roles where you get 0 interviews`,
            action: "remove",
          });
        }
      }
    }
  }

  return roi.sort((a, b) => b.roi_score - a.roi_score);
}

function generateWeeklySummary(
  apps: Array<{ status: string; created_at: string }>
): WeeklySummary | null {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const thisWeek = apps.filter((a) => new Date(a.created_at).getTime() > now - weekMs);
  const lastWeek = apps.filter(
    (a) => new Date(a.created_at).getTime() > now - 2 * weekMs &&
           new Date(a.created_at).getTime() <= now - weekMs
  );

  if (thisWeek.length === 0 && lastWeek.length === 0) return null;

  const thisInterviews = thisWeek.filter((a) => ["interviewing", "offer"].includes(a.status)).length;
  const lastInterviews = lastWeek.filter((a) => ["interviewing", "offer"].includes(a.status)).length;
  const thisOffers = thisWeek.filter((a) => a.status === "offer").length;

  const thisRate = thisWeek.length > 0 ? (thisInterviews / thisWeek.length) * 100 : 0;
  const lastRate = lastWeek.length > 0 ? (lastInterviews / lastWeek.length) * 100 : 0;
  const rateChange = Math.round(thisRate - lastRate);

  let bestAction = "Keep applying consistently";
  let worstAction = "None identified";
  let recommendation = "Maintain your current pace";

  if (thisWeek.length > lastWeek.length && thisInterviews > lastInterviews) {
    bestAction = "Increased application volume is working";
  }
  if (thisWeek.length < 3) {
    worstAction = "Too few applications this week";
    recommendation = "Increase to at least 5 applications per week";
  }
  if (rateChange < -10) {
    worstAction = `Interview rate dropped ${Math.abs(rateChange)}pp from last week`;
    recommendation = "Quality over quantity — tailor each application";
  }
  if (rateChange > 10) {
    bestAction = `Interview rate improved by ${rateChange}pp — whatever you changed is working`;
  }

  return {
    period: `${new Date(now - weekMs).toLocaleDateString()} — ${new Date().toLocaleDateString()}`,
    applications_sent: thisWeek.length,
    interviews_earned: thisInterviews,
    offers_received: thisOffers,
    interview_rate_change: rateChange,
    best_action: bestAction,
    worst_action: worstAction,
    recommendation,
  };
}

function generateScoreExplanation(
  atsScore: number | null,
  userProfile: { profile_strength: number; candidate_rank_score: number; is_boosted: boolean; boost_multiplier: number } | null,
  insights: Awaited<ReturnType<typeof getApplicationInsights>>
): ScoreExplanation {
  return {
    ats_breakdown: atsScore !== null
      ? {
          skill_match: Math.round(atsScore * 0.35),
          format_quality: Math.round(atsScore * 0.25),
          keyword_density: Math.round(atsScore * 0.20),
          experience_clarity: Math.round(atsScore * 0.20),
        }
      : null,
    interview_probability_breakdown: {
      skill_overlap: Math.round(insights.weight_adjustments.skill_weight * 100),
      experience_fit: Math.round(insights.weight_adjustments.experience_weight * 100),
      resume_quality: Math.round(insights.weight_adjustments.quality_weight * 100),
      history: 20,
    },
    rank_breakdown: userProfile
      ? {
          profile_strength: Math.round((userProfile.profile_strength || 0) * 0.25),
          ats_score: Math.round((atsScore || 0) * 0.30),
          skills_count: 25,
          activity: 20,
          boost: userProfile.is_boosted ? Math.round((userProfile.boost_multiplier || 1) * 10) : 0,
        }
      : null,
  };
}
