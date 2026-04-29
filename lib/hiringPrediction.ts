import { createClient } from "@/lib/supabase/server";

export interface HiringPrediction {
  probability: number; // 0-100
  confidence: "high" | "medium" | "low";
  factors: {
    skill_match_score: number;
    experience_fit: number;
    historical_success_rate: number;
    role_demand: number;
  };
  similar_hires: number;
  avg_days_to_hire: number | null;
  recommendations: string[];
}

/**
 * Predict hiring probability for a candidate-job pair.
 * Uses historical hiring outcomes as training data.
 * Pure JS model — no AI API cost.
 */
export async function predictHiringSuccess(
  candidateSkills: string[],
  jobTitle: string,
  jobSkillsRequired: string[],
  matchScore: number,
  experienceYears: number,
  requiredExperience?: number
): Promise<HiringPrediction> {
  const supabase = await createClient();

  // 1. Skill overlap
  const normalizedCandidateSkills = candidateSkills.map((s) => s.toLowerCase().trim());
  const normalizedJobSkills = jobSkillsRequired.map((s) => s.toLowerCase().trim());
  const matchedSkills = normalizedCandidateSkills.filter((s) =>
    normalizedJobSkills.some((js) => js.includes(s) || s.includes(js))
  );
  const skillMatchScore = normalizedJobSkills.length > 0
    ? Math.round((matchedSkills.length / normalizedJobSkills.length) * 100)
    : matchScore;

  // 2. Experience fit
  const requiredExp = requiredExperience || 2;
  let experienceFit = 100;
  if (experienceYears < requiredExp) {
    experienceFit = Math.round((experienceYears / requiredExp) * 100);
  } else if (experienceYears > requiredExp * 2) {
    experienceFit = 80; // Overqualified penalty
  }

  // 3. Historical success rate for similar roles
  const normalizedTitle = jobTitle.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const titleWords = normalizedTitle.split(/\s+/).filter((w) => w.length > 2);

  let historicalRate = 50;
  let similarHires = 0;
  let avgDaysToHire: number | null = null;
  let roleDemand = 50;
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Fetch hiring outcomes + skill demand in parallel (both independent)
  const [{ data: outcomes }, { data: demandData }] = await Promise.all([
    titleWords.length > 0
      ? supabase.from("hiring_outcomes").select("was_hired, days_to_hire, match_score, job_title").limit(500)
      : Promise.resolve({ data: null }),
    supabase
      .from("skill_demand")
      .select("demand_count, supply_count")
      .eq("month", currentMonth)
      .in("normalized_skill", normalizedCandidateSkills.slice(0, 10)),
  ]);

  if (outcomes && outcomes.length > 0) {
    const relevant = outcomes.filter((o) => {
      if (!o.match_score) return false;
      if (!o.job_title) return false;
      const outcomeTitle = o.job_title.toLowerCase().replace(/[^a-z0-9\s]/g, "");
      return titleWords.some((w) => outcomeTitle.includes(w));
    });

    const usable = relevant.length >= 5 ? relevant : outcomes.filter((o) => o.match_score);

    if (usable.length >= 5) {
      const hired = usable.filter((o) => o.was_hired);
      historicalRate = Math.round((hired.length / usable.length) * 100);
      similarHires = hired.length;

      const hiresWithDays = hired.filter((h) => h.days_to_hire);
      if (hiresWithDays.length > 0) {
        avgDaysToHire = Math.round(
          hiresWithDays.reduce((sum, h) => sum + (h.days_to_hire || 0), 0) / hiresWithDays.length
        );
      }
    }
  }

  if (demandData && demandData.length > 0) {
    const totalDemand = demandData.reduce((s, d) => s + (d.demand_count || 0), 0);
    const totalSupply = demandData.reduce((s, d) => s + (d.supply_count || 0), 0);
    if (totalSupply > 0) {
      const ratio = totalDemand / totalSupply;
      roleDemand = Math.min(100, Math.round(ratio * 50)); // >2 ratio = 100%
    }
  }

  // 5. Weighted prediction
  const probability = Math.round(
    skillMatchScore * 0.35 +
    experienceFit * 0.25 +
    historicalRate * 0.25 +
    roleDemand * 0.15
  );

  // 6. Confidence level
  let confidence: "high" | "medium" | "low" = "low";
  if (similarHires >= 20) confidence = "high";
  else if (similarHires >= 5) confidence = "medium";

  // 7. Recommendations
  const recommendations: string[] = [];
  if (skillMatchScore < 60) {
    const missingSkills = normalizedJobSkills.filter(
      (s) => !normalizedCandidateSkills.some((cs) => cs.includes(s) || s.includes(cs))
    );
    if (missingSkills.length > 0) {
      recommendations.push(`Add missing skills: ${missingSkills.slice(0, 3).join(", ")}`);
    }
  }
  if (experienceFit < 70) {
    recommendations.push("Highlight relevant project experience to compensate for experience gap.");
  }
  if (probability < 50) {
    recommendations.push("Consider tailoring your resume specifically for this role to improve chances.");
  }
  if (probability >= 70) {
    recommendations.push("Strong match! Apply quickly — high-demand roles fill fast.");
  }

  return {
    probability: Math.max(5, Math.min(95, probability)),
    confidence,
    factors: {
      skill_match_score: skillMatchScore,
      experience_fit: experienceFit,
      historical_success_rate: historicalRate,
      role_demand: roleDemand,
    },
    similar_hires: similarHires,
    avg_days_to_hire: avgDaysToHire,
    recommendations,
  };
}

/**
 * Record a hiring outcome for the prediction model's training data.
 */
export async function recordHiringOutcome(outcome: {
  jobId?: string;
  candidateId?: string;
  recruiterId?: string;
  matchScore?: number;
  interviewScore?: number;
  wasHired: boolean;
  daysToHire?: number;
  skillsMatched?: string[];
  skillsMissing?: string[];
  jobTitle?: string;
  jobLocation?: string;
  salaryOffered?: number;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("hiring_outcomes").insert({
      job_id: outcome.jobId || null,
      candidate_id: outcome.candidateId || null,
      recruiter_id: outcome.recruiterId || null,
      match_score: outcome.matchScore || null,
      interview_score: outcome.interviewScore || null,
      was_hired: outcome.wasHired,
      days_to_hire: outcome.daysToHire || null,
      skills_matched: outcome.skillsMatched || [],
      skills_missing: outcome.skillsMissing || [],
      job_title: outcome.jobTitle || null,
      job_location: outcome.jobLocation || null,
      salary_offered: outcome.salaryOffered || null,
    });
  } catch {
    // Non-critical
  }
}
