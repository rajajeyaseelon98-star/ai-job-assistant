import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

function formatSalary(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)} LPA`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return amount.toLocaleString();
}

function deslugify(slug: string): { title: string; location: string | null } {
  const parts = slug.split("-in-");
  const title = parts[0].replace(/-/g, " ");
  const location = parts[1] ? parts[1].replace(/-/g, " ") : null;
  return { title, location };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { title, location } = deslugify(slug);
  const locationStr = location ? ` in ${location}` : " in India";

  return {
    title: `${title} Salary${locationStr} 2026 | AI Job Assistant`,
    description: `Discover ${title} salary ranges, trends, and percentiles${locationStr}. Compare compensation data based on experience and skills.`,
    openGraph: {
      title: `${title} Salary${locationStr} 2026`,
      description: `Salary data for ${title}${locationStr}`,
      type: "website",
      siteName: "AI Job Assistant",
    },
  };
}

export default async function SEOSalaryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { title, location } = deslugify(slug);
  const locationStr = location ? ` in ${location}` : "";

  const supabase = await createClient();

  // Get salary data from salary_data table
  let query = supabase
    .from("salary_data")
    .select("*")
    .ilike("normalized_title", `%${title}%`);

  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  const { data: salaryRows } = await query.limit(100);

  // Also get from job postings
  const { data: jobPostings } = await supabase
    .from("job_postings")
    .select("title, salary_min, salary_max, location, skills_required")
    .ilike("title", `%${title}%`)
    .not("salary_min", "is", null)
    .eq("status", "active")
    .limit(50);

  // Calculate stats
  const salaries: number[] = [];
  const skillsCount = new Map<string, number>();

  for (const row of salaryRows || []) {
    if (row.salary_avg) salaries.push(Number(row.salary_avg));
  }
  for (const jp of jobPostings || []) {
    if (jp.salary_min) salaries.push(Number(jp.salary_min));
    if (jp.salary_max) salaries.push(Number(jp.salary_max));
    for (const skill of (jp.skills_required as string[]) || []) {
      skillsCount.set(skill, (skillsCount.get(skill) || 0) + 1);
    }
  }

  salaries.sort((a, b) => a - b);
  const n = salaries.length;

  const hasData = n > 0;
  const avgSalary = hasData ? Math.round(salaries.reduce((a, b) => a + b, 0) / n) : 0;
  const minSalary = hasData ? salaries[0] : 0;
  const maxSalary = hasData ? salaries[n - 1] : 0;
  const p25 = hasData ? salaries[Math.floor(n * 0.25)] : 0;
  const p50 = hasData ? salaries[Math.floor(n * 0.5)] : 0;
  const p75 = hasData ? salaries[Math.floor(n * 0.75)] : 0;

  const topSkills = [...skillsCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill]) => skill);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-semibold text-blue-600">
            AI Job Assistant
          </Link>
          <nav className="flex gap-3">
            <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900">
              Browse Jobs
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Sign Up Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 capitalize">
          {title} Salary{locationStr} (2026)
        </h1>
        <p className="mt-2 text-gray-600">
          Salary data based on {n} data point{n !== 1 ? "s" : ""} from job postings and market research
        </p>

        {hasData ? (
          <>
            {/* Salary Range Card */}
            <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-sm text-gray-500">Minimum</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900">
                    {formatSalary(minSalary)}
                  </div>
                </div>
                <div className="border-x border-gray-100">
                  <div className="text-sm text-gray-500">Average</div>
                  <div className="mt-1 text-3xl font-bold text-blue-600">
                    {formatSalary(avgSalary)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Maximum</div>
                  <div className="mt-1 text-2xl font-bold text-gray-900">
                    {formatSalary(maxSalary)}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-700">Salary Percentiles</h3>
                <div className="mt-2 flex justify-between text-sm text-gray-600">
                  <span>25th: {formatSalary(p25)}</span>
                  <span>50th (Median): {formatSalary(p50)}</span>
                  <span>75th: {formatSalary(p75)}</span>
                </div>
              </div>
            </div>

            {/* Common Skills */}
            {topSkills.length > 0 && (
              <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  Common Skills for {title}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {topSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-8 rounded-2xl bg-white p-12 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              No salary data yet
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Salary data for this role is being collected. Sign up to contribute and access salary insights.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900">
            Know Your Worth
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Get personalized salary insights, ATS resume scoring, and AI job matching
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Get Started Free
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} AI Job Assistant | Salary Data
      </footer>
    </div>
  );
}
