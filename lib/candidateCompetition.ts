import { createClient } from "@/lib/supabase/server";

export interface CompetitionData {
  total_applicants: number;
  your_rank: number;
  percentile: number; // "You're in top X%"
  your_match_score: number;
  avg_match_score: number;
  top_score: number;
  competition_level: "low" | "medium" | "high" | "very_high";
  insights: string[];
}

/**
 * Get candidate's competitive position for a specific job.
 * Shows ranking among other applicants.
 */
export async function getJobCompetition(
  userId: string,
  jobId: string,
  userMatchScore: number
): Promise<CompetitionData> {
  const supabase = await createClient();

  // Count total applicants for this job
  const { data: applications } = await supabase
    .from("job_applications")
    .select("candidate_id, match_score")
    .eq("job_id", jobId);

  const allApps = applications || [];
  const totalApplicants = allApps.length;

  if (totalApplicants === 0) {
    return {
      total_applicants: 1,
      your_rank: 1,
      percentile: 100,
      your_match_score: userMatchScore,
      avg_match_score: userMatchScore,
      top_score: userMatchScore,
      competition_level: "low",
      insights: ["You're among the first applicants — early applications often get more attention!"],
    };
  }

  // Calculate scores
  const scores = allApps.map((a) => a.match_score || 0);
  scores.push(userMatchScore); // Include user's score
  scores.sort((a, b) => b - a);

  const yourRank = scores.indexOf(userMatchScore) + 1;
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const topScore = scores[0];
  const percentile = Math.round(((scores.length - yourRank) / scores.length) * 100);

  // Competition level
  let competitionLevel: CompetitionData["competition_level"] = "low";
  if (totalApplicants > 50) competitionLevel = "very_high";
  else if (totalApplicants > 20) competitionLevel = "high";
  else if (totalApplicants > 5) competitionLevel = "medium";

  // Insights
  const insights: string[] = [];

  if (percentile >= 90) {
    insights.push(`You're in the top ${100 - percentile}% of applicants — excellent position!`);
  } else if (percentile >= 70) {
    insights.push(`You rank #${yourRank} out of ${totalApplicants + 1} applicants`);
  } else {
    insights.push(`${totalApplicants} other candidates applied — consider tailoring your resume`);
  }

  if (userMatchScore > avgScore + 10) {
    insights.push(`Your match score is ${userMatchScore - avgScore}% above average`);
  } else if (userMatchScore < avgScore - 10) {
    insights.push(`Your score is below average — use Resume Tailoring to improve`);
  }

  if (totalApplicants <= 3) {
    insights.push("Low competition — your chances are strong!");
  } else if (totalApplicants >= 50) {
    insights.push("High competition — apply quickly and follow up");
  }

  return {
    total_applicants: totalApplicants + 1,
    your_rank: yourRank,
    percentile,
    your_match_score: userMatchScore,
    avg_match_score: avgScore,
    top_score: topScore,
    competition_level: competitionLevel,
    insights,
  };
}

/**
 * Get user's overall competitive position across all applications.
 */
export async function getOverallCompetition(userId: string): Promise<{
  total_jobs_applied: number;
  avg_rank_percentile: number;
  strongest_skill_area: string | null;
  competitive_advantage: string;
}> {
  const supabase = await createClient();

  // Get user's application count
  const { count: totalApps } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Get user's candidate rank vs others
  const { data: user } = await supabase
    .from("users")
    .select("candidate_rank_score")
    .eq("id", userId)
    .single();

  const userScore = user?.candidate_rank_score || 0;

  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gt("candidate_rank_score", 0);

  const { count: lowerUsers } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .lt("candidate_rank_score", userScore)
    .gt("candidate_rank_score", 0);

  const avgPercentile = (totalUsers || 1) > 0
    ? Math.round(((lowerUsers || 0) / (totalUsers || 1)) * 100)
    : 50;

  // Get strongest skill area
  const { data: skills } = await supabase
    .from("candidate_skills")
    .select("skill, years_experience")
    .eq("user_id", userId)
    .order("years_experience", { ascending: false })
    .limit(1);

  const strongestSkill = skills?.[0]?.skill || null;

  // Competitive advantage text
  let advantage = "Build your profile to discover your competitive edge";
  if (avgPercentile >= 80) advantage = "You outperform most candidates — leverage your strong profile";
  else if (avgPercentile >= 60) advantage = "Above average — focus on targeted applications";
  else if (avgPercentile >= 40) advantage = "Average — improve your ATS score and add more skills";
  else advantage = "Improve your resume and complete your profile to compete better";

  return {
    total_jobs_applied: totalApps || 0,
    avg_rank_percentile: avgPercentile,
    strongest_skill_area: strongestSkill,
    competitive_advantage: advantage,
  };
}
