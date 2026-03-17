import { createClient } from "@/lib/supabase/server";
import { getApplicationInsights } from "@/lib/learningEngine";
import type { StructuredResume } from "@/types/structuredResume";

export interface InterviewProbability {
  score: number; // 0-100
  level: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  boost_tips: string[];
}

/**
 * Calculate interview probability score based on multiple signals.
 * No AI call — pure JS for speed and cost savings.
 *
 * Factors:
 * 1. Skill overlap (35%)
 * 2. Experience alignment (25%)
 * 3. Resume quality / ATS score (20%)
 * 4. Historical success rate (20%)
 */
export async function calculateInterviewProbability(
  userId: string,
  structured: StructuredResume,
  jobTitle: string,
  jobDescription: string,
  matchScore: number,
  atsScore?: number
): Promise<InterviewProbability> {
  const reasons: string[] = [];
  const boost_tips: string[] = [];
  const jobText = (jobTitle + " " + jobDescription).toLowerCase();

  // --- Factor 1: Skill Overlap (35%) ---
  const resumeSkills = new Set(structured.skills.map((s) => s.toLowerCase()));
  let skillMatches = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  // Extract key skills from job description
  const commonTechSkills = [
    "react", "angular", "vue", "node", "python", "java", "typescript", "javascript",
    "aws", "docker", "kubernetes", "sql", "mongodb", "postgresql", "redis", "graphql",
    "rest", "api", "git", "ci/cd", "agile", "scrum", "figma", "tailwind", "next.js",
    "express", "django", "flask", "spring", "golang", "rust", "c++", "swift",
    "machine learning", "deep learning", "tensorflow", "pytorch", "data science",
  ];

  for (const skill of commonTechSkills) {
    const inJob = jobText.includes(skill);
    const inResume = resumeSkills.has(skill) ||
      Array.from(resumeSkills).some((s) => s.includes(skill) || skill.includes(s));

    if (inJob && inResume) {
      skillMatches++;
      matchedSkills.push(skill);
    } else if (inJob && !inResume) {
      missingSkills.push(skill);
    }
  }

  const jobSkillCount = matchedSkills.length + missingSkills.length;
  const skillOverlapPct = jobSkillCount > 0
    ? (skillMatches / jobSkillCount) * 100
    : matchScore; // fallback to match score
  const skillScore = Math.min(100, skillOverlapPct);

  if (skillScore >= 70) {
    reasons.push(`Strong skill alignment (${matchedSkills.slice(0, 5).join(", ")})`);
  } else if (skillScore >= 40) {
    reasons.push(`Partial skill match — missing: ${missingSkills.slice(0, 3).join(", ")}`);
    boost_tips.push(`Add ${missingSkills[0]} to your resume to increase chances`);
  } else {
    reasons.push(`Low skill overlap with this role`);
    boost_tips.push(`Focus on roles matching your core skills: ${structured.skills.slice(0, 3).join(", ")}`);
  }

  // --- Factor 2: Experience Alignment (25%) ---
  let experienceScore = 50;
  const years = structured.total_years_experience || 0;

  if (jobText.includes("senior") || jobText.includes("lead") || jobText.includes("principal")) {
    if (years >= 5) { experienceScore = 95; reasons.push(`${years}+ years experience matches senior role`); }
    else if (years >= 3) { experienceScore = 60; reasons.push(`${years} years — slightly under for senior role`); }
    else { experienceScore = 20; boost_tips.push("This role typically requires 5+ years experience"); }
  } else if (jobText.includes("junior") || jobText.includes("entry") || jobText.includes("intern")) {
    if (years <= 3) { experienceScore = 90; reasons.push("Experience level well-suited for entry role"); }
    else { experienceScore = 60; reasons.push("You may be overqualified for this position"); }
  } else if (jobText.includes("mid") || jobText.includes("intermediate")) {
    if (years >= 2 && years <= 6) { experienceScore = 90; reasons.push("Experience perfectly matches mid-level requirements"); }
    else { experienceScore = 55; }
  } else {
    // Default: more experience = slightly better
    experienceScore = Math.min(90, 40 + years * 8);
    if (years >= 3) reasons.push(`${years} years of relevant experience`);
  }

  // Role title match bonus
  const roleMatch = structured.preferred_roles.some((r) =>
    jobText.includes(r.toLowerCase())
  );
  if (roleMatch) {
    experienceScore = Math.min(100, experienceScore + 15);
    reasons.push("Job title matches your preferred roles");
  }

  // --- Factor 3: Resume Quality / ATS Score (20%) ---
  let qualityScore = 50;
  if (atsScore !== undefined) {
    qualityScore = atsScore;
    if (atsScore >= 75) {
      reasons.push(`Strong ATS score (${atsScore}/100)`);
    } else if (atsScore >= 50) {
      boost_tips.push("Improve your ATS score to 75+ for better interview chances");
    } else {
      boost_tips.push("Your ATS score is low — use Resume Analyzer to optimize");
    }
  } else {
    // Estimate from resume completeness
    let completeness = 0;
    if (structured.summary && structured.summary.length > 50) completeness += 25;
    if (structured.skills.length >= 5) completeness += 25;
    if (structured.experience.length >= 1) completeness += 25;
    if (structured.education.length >= 1) completeness += 15;
    if (structured.projects.length >= 1) completeness += 10;
    qualityScore = completeness;
  }

  // --- Factor 4: Historical Success Rate (20%) ---
  let historyScore = 50; // neutral default
  try {
    const supabase = await createClient();
    const { data: apps } = await supabase
      .from("applications")
      .select("status")
      .eq("user_id", userId)
      .in("status", ["applied", "interviewing", "offer", "rejected", "withdrawn"]);

    if (apps && apps.length >= 3) {
      const total = apps.length;
      const interviews = apps.filter((a) =>
        ["interviewing", "offer"].includes(a.status)
      ).length;
      const successRate = (interviews / total) * 100;
      historyScore = Math.min(100, successRate * 1.5); // amplify the signal

      if (successRate >= 30) {
        reasons.push(`${Math.round(successRate)}% of your past applications led to interviews`);
      } else if (successRate > 0) {
        boost_tips.push("Tailor each application to improve your interview rate");
      } else {
        boost_tips.push("Consider using Resume Tailoring for each application");
      }
    }
  } catch {
    // History unavailable, use neutral score
  }

  // --- Dynamic Weights from Learning Engine ---
  let wSkill = 0.35;
  let wExp = 0.25;
  let wQuality = 0.20;
  const wHistory = 0.20;

  try {
    const insights = await getApplicationInsights(userId);
    if (insights.total_applications >= 5) {
      // Use learned weights (learning engine adjusts based on outcomes)
      wSkill = insights.weight_adjustments.skill_weight;
      wExp = insights.weight_adjustments.experience_weight;
      wQuality = insights.weight_adjustments.quality_weight;
    }
  } catch {
    // Use defaults
  }

  // --- Combine weighted scores ---
  const totalScore = Math.round(
    skillScore * wSkill +
    experienceScore * wExp +
    qualityScore * wQuality +
    historyScore * wHistory
  );

  const finalScore = Math.min(100, Math.max(0, totalScore));

  const level: InterviewProbability["level"] =
    finalScore >= 70 ? "HIGH" :
    finalScore >= 45 ? "MEDIUM" :
    "LOW";

  // Ensure we have at least 1 reason and 1 tip
  if (reasons.length === 0) {
    reasons.push(
      level === "HIGH" ? "Strong overall match for this position" :
      level === "MEDIUM" ? "Decent match — some areas to improve" :
      "This role may not be the best fit"
    );
  }
  if (boost_tips.length === 0 && level !== "HIGH") {
    boost_tips.push("Use Resume Tailoring to customize your resume for this job");
  }

  return {
    score: finalScore,
    level,
    reasons: reasons.slice(0, 5),
    boost_tips: boost_tips.slice(0, 3),
  };
}
