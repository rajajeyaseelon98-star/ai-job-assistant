import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Highest Paying Roles & Salary Data 2026 | AI Job Assistant",
  description:
    "Real salary data for tech roles in India. See highest paying roles, salary ranges, and percentiles for 2026.",
  openGraph: {
    title: "Highest Paying Tech Roles in 2026",
    description: "Real salary data from job postings. Find out what you should be earning.",
  },
};

interface SalaryRow {
  role: string;
  location: string | null;
  min_salary: number;
  max_salary: number;
  avg_salary: number;
  median_salary: number;
  sample_size: number;
}

export default async function SalaryIndexPage() {
  const supabase = await createClient();

  // Aggregate salary data from salary_data table
  const { data: salaryData } = await supabase
    .from("salary_data")
    .select("role, location, min_salary, max_salary, avg_salary, median_salary, sample_size")
    .order("avg_salary", { ascending: false })
    .limit(50);

  const roles = (salaryData || []) as SalaryRow[];

  // Group by role (aggregate locations)
  const roleMap = new Map<string, { total: number; count: number; min: number; max: number; samples: number }>();
  for (const r of roles) {
    const key = r.role.toLowerCase();
    const existing = roleMap.get(key) || { total: 0, count: 0, min: Infinity, max: 0, samples: 0 };
    existing.total += r.avg_salary * r.sample_size;
    existing.count += r.sample_size;
    existing.min = Math.min(existing.min, r.min_salary);
    existing.max = Math.max(existing.max, r.max_salary);
    existing.samples += r.sample_size;
    roleMap.set(key, existing);
  }

  const aggregated = Array.from(roleMap.entries())
    .map(([role, data]) => ({
      role,
      avg: Math.round(data.total / Math.max(data.count, 1)),
      min: data.min === Infinity ? 0 : data.min,
      max: data.max,
      samples: data.samples,
    }))
    .sort((a, b) => b.avg - a.avg);

  // Location-specific highlights
  const locations = [...new Set(roles.map((r) => r.location).filter(Boolean))].slice(0, 8) as string[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-blue-600 hover:underline">&larr; Home</Link>
        <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Get 3x More Interviews
        </Link>
      </header>

      <h1 className="text-3xl font-bold md:text-4xl">Highest Paying Tech Roles in 2026</h1>
      <p className="mt-2 text-gray-600">
        Salary data from {roles.reduce((s, r) => s + r.sample_size, 0).toLocaleString()} data points. See what you should be earning.
      </p>

      {/* Role Salary Table */}
      <section className="mt-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4 text-right">Avg Salary</th>
                <th className="py-3 pr-4 text-right">Range</th>
                <th className="py-3 text-right">Data Points</th>
              </tr>
            </thead>
            <tbody>
              {aggregated.map((r) => (
                <tr key={r.role} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium capitalize">{r.role}</td>
                  <td className="py-3 pr-4 text-right font-semibold text-blue-600">
                    ₹{(r.avg / 100000).toFixed(1)}L
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-500">
                    ₹{(r.min / 100000).toFixed(0)}L – ₹{(r.max / 100000).toFixed(0)}L
                  </td>
                  <td className="py-3 text-right text-gray-400">{r.samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* By Location */}
      {locations.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Salaries by City</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {locations.map((loc) => (
              <Link
                key={loc}
                href={`/salary/${encodeURIComponent(loc.toLowerCase().replace(/\s+/g, "-"))}`}
                className="rounded-full border px-4 py-1.5 text-sm hover:bg-gray-50"
              >
                {loc}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mt-12 rounded-xl bg-blue-50 p-8 text-center">
        <h2 className="text-xl font-bold">Know Your Worth. Get Paid More.</h2>
        <p className="mt-2 text-gray-600">
          Our AI matches you to jobs that pay what you deserve — and auto-applies for you.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Get 3x More Interviews — Free
        </Link>
      </section>

      <footer className="mt-8 border-t pt-6 text-center text-sm text-gray-400">
        Salary data sourced from job postings. Updated monthly. &copy; {new Date().getFullYear()} AI Job Assistant
      </footer>
    </div>
  );
}
