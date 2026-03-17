import { createClient } from "@/lib/supabase/server";

export interface SalaryInsight {
  job_title: string;
  location: string | null;
  experience_range: string;
  salary_range: { min: number; max: number; avg: number };
  currency: string;
  data_points: number;
  percentiles: { p25: number; p50: number; p75: number };
  trend: "rising" | "stable" | "declining";
  comparable_roles: Array<{ title: string; avg_salary: number }>;
}

/**
 * Normalize a job title for consistent matching.
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(sr|senior|jr|junior|lead|principal|staff|chief)\b/g, "")
    .replace(/\b(i|ii|iii|iv|v|1|2|3|4|5)\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Get salary intelligence for a specific role.
 */
export async function getSalaryIntelligence(
  jobTitle: string,
  location?: string,
  experienceYears?: number
): Promise<SalaryInsight> {
  const supabase = await createClient();
  const normalizedTitle = normalizeTitle(jobTitle);

  // Query salary data
  let query = supabase
    .from("salary_data")
    .select("*")
    .ilike("normalized_title", `%${normalizedTitle}%`);

  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  const { data: salaryRows } = await query.limit(100);
  const rows = salaryRows || [];

  // Also check job postings for salary data
  const { data: jobPostings } = await supabase
    .from("job_postings")
    .select("title, salary_min, salary_max, location")
    .ilike("title", `%${jobTitle}%`)
    .not("salary_min", "is", null)
    .limit(50);

  // Combine data sources
  const allSalaries: number[] = [];
  for (const row of rows) {
    if (row.salary_avg) allSalaries.push(Number(row.salary_avg));
    if (row.salary_min) allSalaries.push(Number(row.salary_min));
    if (row.salary_max) allSalaries.push(Number(row.salary_max));
  }

  for (const jp of jobPostings || []) {
    if (jp.salary_min) allSalaries.push(Number(jp.salary_min));
    if (jp.salary_max) allSalaries.push(Number(jp.salary_max));
  }

  // Sort for percentile calculation
  allSalaries.sort((a, b) => a - b);
  const n = allSalaries.length;

  let salaryRange = { min: 0, max: 0, avg: 0 };
  let percentiles = { p25: 0, p50: 0, p75: 0 };

  if (n > 0) {
    salaryRange = {
      min: allSalaries[0],
      max: allSalaries[n - 1],
      avg: Math.round(allSalaries.reduce((a, b) => a + b, 0) / n),
    };
    percentiles = {
      p25: allSalaries[Math.floor(n * 0.25)] || allSalaries[0],
      p50: allSalaries[Math.floor(n * 0.5)] || allSalaries[0],
      p75: allSalaries[Math.floor(n * 0.75)] || allSalaries[0],
    };
  }

  // Experience range label
  const expYears = experienceYears || 0;
  let experienceRange = "0-2 years";
  if (expYears >= 10) experienceRange = "10+ years";
  else if (expYears >= 5) experienceRange = "5-10 years";
  else if (expYears >= 2) experienceRange = "2-5 years";

  // Trend detection (compare current month vs previous months)
  let trend: "rising" | "stable" | "declining" = "stable";
  if (rows.length >= 2) {
    const sorted = [...rows].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    const recent = sorted.slice(0, Math.ceil(sorted.length / 2));
    const older = sorted.slice(Math.ceil(sorted.length / 2));
    const recentAvg = recent.reduce((s, r) => s + Number(r.salary_avg || 0), 0) / recent.length;
    const olderAvg = older.reduce((s, r) => s + Number(r.salary_avg || 0), 0) / older.length;
    if (olderAvg > 0) {
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;
      if (change > 5) trend = "rising";
      else if (change < -5) trend = "declining";
    }
  }

  // Find comparable roles
  const titleWords = normalizedTitle.split(/\s+/).filter((w) => w.length > 3);
  const comparableRoles: Array<{ title: string; avg_salary: number }> = [];

  if (titleWords.length > 0) {
    const { data: similar } = await supabase
      .from("salary_data")
      .select("job_title, salary_avg")
      .not("normalized_title", "eq", normalizedTitle)
      .ilike("normalized_title", `%${titleWords[0]}%`)
      .not("salary_avg", "is", null)
      .limit(5);

    if (similar) {
      for (const s of similar) {
        comparableRoles.push({
          title: s.job_title,
          avg_salary: Number(s.salary_avg),
        });
      }
    }
  }

  return {
    job_title: jobTitle,
    location: location || null,
    experience_range: experienceRange,
    salary_range: salaryRange,
    currency: "INR",
    data_points: n,
    percentiles,
    trend,
    comparable_roles: comparableRoles,
  };
}

/**
 * Ingest salary data from a job posting (called when jobs are posted/scraped).
 */
export async function ingestSalaryData(
  jobTitle: string,
  salaryMin?: number,
  salaryMax?: number,
  location?: string,
  experienceYears?: number
): Promise<void> {
  if (!salaryMin && !salaryMax) return;

  try {
    const supabase = await createClient();
    const normalizedTitle = normalizeTitle(jobTitle);
    const avg = salaryMin && salaryMax
      ? Math.round((salaryMin + salaryMax) / 2)
      : salaryMin || salaryMax || 0;

    await supabase.from("salary_data").insert({
      job_title: jobTitle,
      normalized_title: normalizedTitle,
      location: location || null,
      experience_years: experienceYears || null,
      salary_min: salaryMin || null,
      salary_max: salaryMax || null,
      salary_avg: avg,
      source: "job_posting",
    });
  } catch {
    // Non-critical
  }
}
