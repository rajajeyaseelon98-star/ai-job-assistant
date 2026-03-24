import { createClient } from "@/lib/supabase/server";

export interface SkillDemandInfo {
  skill: string;
  demand_count: number;
  supply_count: number;
  demand_supply_ratio: number;
  trend: number; // % change
  avg_salary: number | null;
  top_roles: string[];
  status: "hot" | "growing" | "stable" | "declining" | "oversaturated";
}

export interface SkillDemandDashboard {
  trending_skills: SkillDemandInfo[];
  declining_skills: SkillDemandInfo[];
  highest_paying: SkillDemandInfo[];
  most_in_demand: SkillDemandInfo[];
  your_skills_analysis: SkillDemandInfo[];
}

/**
 * Get skill demand dashboard for a user.
 */
export async function getSkillDemandDashboard(
  userSkills: string[]
): Promise<SkillDemandDashboard> {
  const supabase = await createClient();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Get all current month demand data
  const { data: allDemand } = await supabase
    .from("skill_demand")
    .select("*")
    .eq("month", currentMonth)
    .order("demand_count", { ascending: false })
    .limit(200);

  const demands = (allDemand || []).map(mapSkillDemand);

  // Normalize user skills for matching
  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim());

  // Categorize
  const trending = demands.filter((d) => d.trend > 10).slice(0, 10);
  const declining = demands.filter((d) => d.trend < -10).slice(0, 10);
  const highestPaying = [...demands]
    .filter((d) => d.avg_salary && d.avg_salary > 0)
    .sort((a, b) => (b.avg_salary || 0) - (a.avg_salary || 0))
    .slice(0, 10);
  const mostInDemand = demands.slice(0, 10);

  // Analyze user's skills against demand
  const userSkillAnalysis = demands.filter((d) =>
    normalizedUserSkills.some(
      (us) => d.skill.toLowerCase().includes(us) || us.includes(d.skill.toLowerCase())
    )
  );

  return {
    trending_skills: trending,
    declining_skills: declining,
    highest_paying: highestPaying,
    most_in_demand: mostInDemand,
    your_skills_analysis: userSkillAnalysis,
  };
}

function mapSkillDemand(row: Record<string, unknown>): SkillDemandInfo {
  const demand = Number(row.demand_count) || 0;
  const supply = Number(row.supply_count) || 0;
  const trend = Number(row.demand_trend) || 0;
  const ratio = supply > 0 ? Math.round((demand / supply) * 100) / 100 : demand > 0 ? 10 : 0;

  let status: SkillDemandInfo["status"] = "stable";
  if (trend > 20 && ratio > 2) status = "hot";
  else if (trend > 5) status = "growing";
  else if (trend < -10) status = "declining";
  else if (ratio < 0.5) status = "oversaturated";

  return {
    skill: row.skill_name as string,
    demand_count: demand,
    supply_count: supply,
    demand_supply_ratio: ratio,
    trend,
    avg_salary: row.avg_salary ? Number(row.avg_salary) : null,
    top_roles: (row.top_roles as string[]) || [],
    status,
  };
}

/**
 * Refresh skill demand data from job postings (called from cron).
 */
export async function refreshSkillDemand(): Promise<{ processed: number }> {
  const supabase = await createClient();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = prevDate.toISOString().slice(0, 7);

  // All three reads are independent — run in parallel
  const [{ data: activeJobs }, { data: candidateSkills }, { data: prevData }] = await Promise.all([
    supabase
      .from("job_postings")
      .select("title, description, skills_required, salary_min, salary_max")
      .eq("status", "active")
      .limit(1000),
    supabase
      .from("candidate_skills")
      .select("skill_normalized")
      .limit(5000),
    supabase
      .from("skill_demand")
      .select("normalized_skill, demand_count")
      .eq("month", prevMonth),
  ]);

  const skillCounts = new Map<string, {
    demand: number;
    salaries: number[];
    roles: Set<string>;
  }>();

  for (const job of activeJobs || []) {
    const skills: string[] = job.skills_required || [];
    for (const skill of skills) {
      const normalized = skill.toLowerCase().trim();
      if (!normalized || normalized.length < 2) continue;

      const entry = skillCounts.get(normalized) || {
        demand: 0,
        salaries: [],
        roles: new Set<string>(),
      };
      entry.demand++;
      if (job.salary_min || job.salary_max) {
        const avg = ((job.salary_min || 0) + (job.salary_max || 0)) / (job.salary_min && job.salary_max ? 2 : 1);
        if (avg > 0) entry.salaries.push(avg);
      }
      if (job.title) entry.roles.add(job.title);
      skillCounts.set(normalized, entry);
    }
  }

  const supplyCounts = new Map<string, number>();
  for (const cs of candidateSkills || []) {
    const normalized = (cs.skill_normalized || "").toLowerCase().trim();
    supplyCounts.set(normalized, (supplyCounts.get(normalized) || 0) + 1);
  }

  const prevCounts = new Map<string, number>();
  for (const p of prevData || []) {
    prevCounts.set(p.normalized_skill, p.demand_count);
  }

  // Batch upsert all skills at once instead of one-at-a-time
  const upsertRows = Array.from(skillCounts).map(([skill, data]) => {
    const prevCount = prevCounts.get(skill) || 0;
    const trend = prevCount > 0
      ? Math.round(((data.demand - prevCount) / prevCount) * 100)
      : 0;

    const avgSalary = data.salaries.length > 0
      ? Math.round(data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length)
      : null;

    return {
      skill_name: skill,
      normalized_skill: skill,
      demand_count: data.demand,
      supply_count: supplyCounts.get(skill) || 0,
      demand_trend: trend,
      avg_salary: avgSalary,
      top_roles: Array.from(data.roles).slice(0, 5),
      month: currentMonth,
      updated_at: new Date().toISOString(),
    };
  });

  if (upsertRows.length > 0) {
    await supabase
      .from("skill_demand")
      .upsert(upsertRows, { onConflict: "normalized_skill,month" });
  }

  return { processed: upsertRows.length };
}
