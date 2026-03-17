import { createClient } from "@/lib/supabase/server";

/**
 * Learning Engine — Tracks application outcomes and adapts scoring.
 *
 * Learns from: applications → interview status → offers/rejections
 * Produces: dynamic weight adjustments, skill insights, role recommendations.
 */

export interface LearningInsights {
  total_applications: number;
  total_interviews: number;
  total_offers: number;
  total_rejections: number;
  interview_rate: number; // 0-100
  offer_rate: number; // 0-100
  avg_response_days: number | null;
  best_performing_skills: string[];
  worst_performing_roles: string[];
  recommendations: string[];
  weight_adjustments: {
    skill_weight: number;
    experience_weight: number;
    quality_weight: number;
  };
}

/**
 * Analyze user's application history and extract learning insights.
 * Used to dynamically adjust scoring weights in interviewScore.ts.
 */
export async function getApplicationInsights(
  userId: string
): Promise<LearningInsights> {
  const supabase = await createClient();

  // Fetch all applications with outcomes
  const { data: apps } = await supabase
    .from("applications")
    .select("role, company, status, notes, applied_date, interview_date, offer_amount, rejection_reason, response_days")
    .eq("user_id", userId)
    .order("applied_date", { ascending: false })
    .limit(200);

  const allApps = apps || [];

  if (allApps.length === 0) {
    return {
      total_applications: 0,
      total_interviews: 0,
      total_offers: 0,
      total_rejections: 0,
      interview_rate: 0,
      offer_rate: 0,
      avg_response_days: null,
      best_performing_skills: [],
      worst_performing_roles: [],
      recommendations: ["Start applying to build your application history!"],
      weight_adjustments: { skill_weight: 0.35, experience_weight: 0.25, quality_weight: 0.20 },
    };
  }

  const totalApps = allApps.length;
  const interviews = allApps.filter((a) => ["interviewing", "offer"].includes(a.status));
  const offers = allApps.filter((a) => a.status === "offer");
  const rejections = allApps.filter((a) => a.status === "rejected");

  const interviewRate = Math.round((interviews.length / totalApps) * 100);
  const offerRate = interviews.length > 0
    ? Math.round((offers.length / interviews.length) * 100)
    : 0;

  // Average response days (from applied to first response)
  const responseDays = allApps
    .filter((a) => typeof a.response_days === "number" && a.response_days > 0)
    .map((a) => a.response_days as number);
  const avgResponseDays = responseDays.length > 0
    ? Math.round(responseDays.reduce((a, b) => a + b, 0) / responseDays.length)
    : null;

  // Analyze which roles got interviews
  const roleInterviewMap = new Map<string, { applied: number; interviewed: number }>();
  for (const app of allApps) {
    const role = (app.role || "unknown").toLowerCase().trim();
    const entry = roleInterviewMap.get(role) || { applied: 0, interviewed: 0 };
    entry.applied++;
    if (["interviewing", "offer"].includes(app.status)) entry.interviewed++;
    roleInterviewMap.set(role, entry);
  }

  // Best performing roles (highest interview rate with >= 2 applications)
  const roleStats = Array.from(roleInterviewMap.entries())
    .filter(([, v]) => v.applied >= 2)
    .map(([role, v]) => ({ role, rate: v.interviewed / v.applied }))
    .sort((a, b) => b.rate - a.rate);

  // Extract skills from notes (auto-apply notes contain match info)
  const interviewedNotes = interviews
    .filter((a) => a.notes)
    .map((a) => a.notes as string)
    .join(" ");

  // Simple skill extraction from interview-successful applications
  const commonSkills = [
    "react", "node", "python", "java", "typescript", "javascript", "aws",
    "docker", "kubernetes", "sql", "mongodb", "next.js", "express",
    "graphql", "rest", "api", "git", "agile", "scrum",
  ];
  const bestSkills = commonSkills
    .filter((skill) => interviewedNotes.toLowerCase().includes(skill))
    .slice(0, 5);

  // Worst performing roles (0% interview rate with >= 2 applications)
  const worstRoles = roleStats
    .filter((r) => r.rate === 0 && roleInterviewMap.get(r.role)!.applied >= 2)
    .map((r) => r.role)
    .slice(0, 3);

  // Generate recommendations
  const recommendations: string[] = [];

  if (interviewRate < 10 && totalApps >= 5) {
    recommendations.push("Your interview rate is low. Consider tailoring your resume for each application using Resume Tailoring.");
  } else if (interviewRate < 20 && totalApps >= 10) {
    recommendations.push("To improve your interview rate, focus on roles matching your strongest skills.");
  }

  if (offerRate < 30 && interviews.length >= 3) {
    recommendations.push("You're getting interviews but fewer offers. Consider using Interview Prep to practice for each role.");
  }

  if (worstRoles.length > 0) {
    recommendations.push(`Consider pivoting away from "${worstRoles[0]}" roles — you haven't gotten interviews for those.`);
  }

  if (roleStats.length > 0 && roleStats[0].rate > 0.3) {
    recommendations.push(`Focus on "${roleStats[0].role}" roles — you have a ${Math.round(roleStats[0].rate * 100)}% interview rate there.`);
  }

  if (avgResponseDays && avgResponseDays > 14) {
    recommendations.push("Average response time is slow. Consider applying to more companies simultaneously.");
  }

  if (recommendations.length === 0) {
    if (totalApps < 5) {
      recommendations.push("Keep applying! More data helps the system learn your patterns.");
    } else {
      recommendations.push("You're on track. Keep applying and tracking outcomes.");
    }
  }

  // Dynamic weight adjustments based on learning
  // If user gets interviews with high skill overlap → increase skill weight
  // If user gets interviews despite low experience → decrease experience weight
  let skillWeight = 0.35;
  let experienceWeight = 0.25;
  let qualityWeight = 0.20;

  if (interviewRate > 25 && bestSkills.length >= 3) {
    // Skills are clearly working → boost skill weight
    skillWeight = 0.40;
    experienceWeight = 0.20;
  } else if (interviewRate < 10 && totalApps >= 10) {
    // Current approach isn't working → boost quality weight (resume matters more)
    qualityWeight = 0.30;
    skillWeight = 0.30;
    experienceWeight = 0.20;
  }

  return {
    total_applications: totalApps,
    total_interviews: interviews.length,
    total_offers: offers.length,
    total_rejections: rejections.length,
    interview_rate: interviewRate,
    offer_rate: offerRate,
    avg_response_days: avgResponseDays,
    best_performing_skills: bestSkills,
    worst_performing_roles: worstRoles,
    recommendations: recommendations.slice(0, 5),
    weight_adjustments: {
      skill_weight: skillWeight,
      experience_weight: experienceWeight,
      quality_weight: qualityWeight,
    },
  };
}

/**
 * Get conversion funnel for dashboard display.
 */
export async function getConversionFunnel(userId: string): Promise<{
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
  pending: number;
}> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("applications")
    .select("status")
    .eq("user_id", userId);

  if (!data) return { applied: 0, interviewing: 0, offers: 0, rejected: 0, pending: 0 };

  return {
    applied: data.filter((a) => a.status === "applied").length,
    interviewing: data.filter((a) => a.status === "interviewing").length,
    offers: data.filter((a) => a.status === "offer").length,
    rejected: data.filter((a) => a.status === "rejected").length,
    pending: data.filter((a) => a.status === "saved").length,
  };
}
