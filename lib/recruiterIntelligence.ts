import { createClient } from "@/lib/supabase/server";

export interface RecruiterIntelligence {
  hiring_metrics: {
    avg_time_to_hire_days: number | null;
    total_hires: number;
    total_applications_received: number;
    screening_to_interview_rate: number;
    interview_to_offer_rate: number;
    offer_acceptance_rate: number;
  };
  pipeline_health: {
    active_jobs: number;
    total_in_pipeline: number;
    by_stage: Record<string, number>;
    stale_applications: number; // no update in 7+ days
  };
  source_performance: Array<{
    source: string;
    applications: number;
    hires: number;
    conversion_rate: number;
  }>;
  top_performing_jobs: Array<{
    job_id: string;
    title: string;
    applications: number;
    avg_match_score: number;
  }>;
  recommendations: string[];
}

/**
 * Generate recruiting intelligence dashboard data.
 */
export async function getRecruiterIntelligence(
  recruiterId: string
): Promise<RecruiterIntelligence> {
  const supabase = await createClient();

  // 1. Get all job applications for this recruiter
  const { data: applications } = await supabase
    .from("job_applications")
    .select("id, job_id, stage, match_score, created_at, updated_at, job_postings!inner(id, title, recruiter_id)")
    .eq("job_postings.recruiter_id", recruiterId);

  const allApps = applications || [];

  // 2. Active jobs
  const { count: activeJobs } = await supabase
    .from("job_postings")
    .select("*", { count: "exact", head: true })
    .eq("recruiter_id", recruiterId)
    .eq("status", "active");

  // 3. Calculate hiring metrics
  const hires = allApps.filter((a) => a.stage === "hired");
  const interviewed = allApps.filter((a) =>
    ["interviewed", "offer_sent", "hired"].includes(a.stage)
  );
  const offersSent = allApps.filter((a) =>
    ["offer_sent", "hired"].includes(a.stage)
  );
  const shortlisted = allApps.filter((a) =>
    ["shortlisted", "interview_scheduled", "interviewed", "offer_sent", "hired"].includes(a.stage)
  );

  // Time to hire (avg days from application to hired)
  let avgTimeToHire: number | null = null;
  if (hires.length > 0) {
    const hireTimes = hires.map((h) => {
      const created = new Date(h.created_at).getTime();
      const updated = new Date(h.updated_at).getTime();
      return Math.round((updated - created) / (1000 * 60 * 60 * 24));
    });
    avgTimeToHire = Math.round(hireTimes.reduce((a, b) => a + b, 0) / hireTimes.length);
  }

  // Pipeline by stage
  const byStage: Record<string, number> = {};
  for (const app of allApps) {
    byStage[app.stage] = (byStage[app.stage] || 0) + 1;
  }

  // Stale applications (no update in 7+ days, still in early stages)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const staleApps = allApps.filter((a) => {
    const isEarly = ["applied", "shortlisted"].includes(a.stage);
    const isStale = new Date(a.updated_at) < sevenDaysAgo;
    return isEarly && isStale;
  });

  // 4. Source performance (auto-apply vs direct vs internal)
  // Infer source from application notes or cover_letter presence
  const sourceMap = new Map<string, { apps: number; hires: number }>();
  for (const app of allApps) {
    const source = "Direct"; // Default; extend when source tracking is added
    const entry = sourceMap.get(source) || { apps: 0, hires: 0 };
    entry.apps++;
    if (app.stage === "hired") entry.hires++;
    sourceMap.set(source, entry);
  }

  const sourcePerformance = Array.from(sourceMap.entries()).map(([source, data]) => ({
    source,
    applications: data.apps,
    hires: data.hires,
    conversion_rate: data.apps > 0 ? Math.round((data.hires / data.apps) * 100) : 0,
  }));

  // 5. Top performing jobs (most applications + highest avg match)
  const jobMap = new Map<string, { title: string; apps: number; scoreSum: number; scoreCount: number }>();
  for (const app of allApps) {
    const jobId = app.job_id;
    const jobData = app.job_postings as unknown as { title: string };
    const entry = jobMap.get(jobId) || { title: jobData?.title || "Unknown", apps: 0, scoreSum: 0, scoreCount: 0 };
    entry.apps++;
    if (app.match_score) {
      entry.scoreSum += app.match_score;
      entry.scoreCount++;
    }
    jobMap.set(jobId, entry);
  }

  const topJobs = Array.from(jobMap.entries())
    .map(([jobId, data]) => ({
      job_id: jobId,
      title: data.title,
      applications: data.apps,
      avg_match_score: data.scoreCount > 0 ? Math.round(data.scoreSum / data.scoreCount) : 0,
    }))
    .sort((a, b) => b.applications - a.applications)
    .slice(0, 5);

  // 6. Recommendations
  const recommendations: string[] = [];

  if (staleApps.length > 5) {
    recommendations.push(`${staleApps.length} applications haven't been reviewed in 7+ days. Review them to keep candidates engaged.`);
  }

  if (allApps.length > 0 && shortlisted.length / allApps.length < 0.2) {
    recommendations.push("Only " + Math.round((shortlisted.length / allApps.length) * 100) + "% of applicants get shortlisted. Consider using AI screening to speed up the process.");
  }

  if (interviewed.length > 0 && offersSent.length / interviewed.length < 0.3) {
    recommendations.push("Low interview-to-offer conversion. Refine your job requirements to attract better-matched candidates.");
  }

  if (avgTimeToHire && avgTimeToHire > 30) {
    recommendations.push(`Average time to hire is ${avgTimeToHire} days. Use auto-shortlisting to speed up screening.`);
  }

  if ((activeJobs || 0) > 0 && allApps.length === 0) {
    recommendations.push("You have active jobs but no applications yet. Consider optimizing your job descriptions with AI.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Your hiring pipeline is healthy. Keep reviewing new applications promptly.");
  }

  return {
    hiring_metrics: {
      avg_time_to_hire_days: avgTimeToHire,
      total_hires: hires.length,
      total_applications_received: allApps.length,
      screening_to_interview_rate: allApps.length > 0
        ? Math.round((interviewed.length / allApps.length) * 100) : 0,
      interview_to_offer_rate: interviewed.length > 0
        ? Math.round((offersSent.length / interviewed.length) * 100) : 0,
      offer_acceptance_rate: offersSent.length > 0
        ? Math.round((hires.length / offersSent.length) * 100) : 0,
    },
    pipeline_health: {
      active_jobs: activeJobs || 0,
      total_in_pipeline: allApps.filter((a) => !["hired", "rejected"].includes(a.stage)).length,
      by_stage: byStage,
      stale_applications: staleApps.length,
    },
    source_performance: sourcePerformance,
    top_performing_jobs: topJobs,
    recommendations: recommendations.slice(0, 5),
  };
}
