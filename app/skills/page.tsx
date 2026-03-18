import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Skills to Get Hired in 2026 | AI Job Assistant",
  description:
    "Data-driven analysis of the most in-demand skills. See which skills guarantee interviews, highest paying skills, and trending tech for 2026.",
  openGraph: {
    title: "Top Skills to Get Hired in 2026",
    description:
      "Data-driven skill demand analysis. See which skills guarantee the most interviews.",
  },
};

interface SkillRow {
  skill_name: string;
  demand_count: number;
  supply_count: number;
  avg_salary: number | null;
  demand_trend: number | null;
}

export default async function SkillsPage() {
  const supabase = await createClient();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: skills } = await supabase
    .from("skill_demand")
    .select("skill_name, demand_count, supply_count, avg_salary, demand_trend")
    .eq("month", currentMonth)
    .order("demand_count", { ascending: false })
    .limit(50);

  const allSkills = (skills || []) as SkillRow[];
  const highDemand = allSkills.filter((s) => s.demand_count > 5);
  const highestPaying = [...allSkills].sort((a, b) => (b.avg_salary || 0) - (a.avg_salary || 0)).slice(0, 10);
  const trending = allSkills.filter((s) => (s.demand_trend || 0) > 0).sort((a, b) => (b.demand_trend || 0) - (a.demand_trend || 0)).slice(0, 10);
  const interviewGuarantee = allSkills
    .filter((s) => s.supply_count > 0)
    .map((s) => ({ ...s, ratio: s.demand_count / s.supply_count }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <header className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Link href="/" className="text-sm text-blue-600 hover:underline">&larr; Home</Link>
        <Link href="/signup" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 min-h-[44px] inline-flex items-center w-full sm:w-auto justify-center active:scale-[0.98] transition-transform">
          Get 3x More Interviews
        </Link>
      </header>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Top Skills to Get Hired in 2026</h1>
      <p className="mt-2 text-sm sm:text-base text-gray-600">
        Real data from {allSkills.reduce((s, sk) => s + sk.demand_count, 0).toLocaleString()} job postings.
        Updated monthly.
      </p>

      {/* Skills That Guarantee Interviews */}
      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg sm:text-xl font-bold">Skills That Guarantee Interviews</h2>
        <p className="text-xs sm:text-sm text-gray-500">Highest demand-to-supply ratio — few candidates, many jobs.</p>
        <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
          {interviewGuarantee.map((s) => (
            <div key={s.skill_name} className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
              <div>
                <span className="text-sm sm:text-base font-medium">{s.skill_name}</span>
                <p className="text-xs text-gray-500">{s.demand_count} jobs · {s.supply_count} candidates</p>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 whitespace-nowrap ml-2">
                {s.ratio.toFixed(1)}x demand
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Highest Paying */}
      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg sm:text-xl font-bold">Highest Paying Skills</h2>
        <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
          {highestPaying.map((s) => (
            <div key={s.skill_name} className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
              <span className="text-sm sm:text-base font-medium">{s.skill_name}</span>
              <span className="text-sm font-semibold text-blue-600 whitespace-nowrap ml-2">
                ₹{Math.round((s.avg_salary || 0) / 100000)}L avg
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Skills */}
      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg sm:text-xl font-bold">Trending Skills (Growing Fast)</h2>
        <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2">
          {trending.map((s) => (
            <div key={s.skill_name} className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
              <span className="text-sm sm:text-base font-medium">{s.skill_name}</span>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 whitespace-nowrap ml-2">
                +{s.demand_trend}% growth
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Most In-Demand */}
      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg sm:text-xl font-bold">Most In-Demand Skills</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {highDemand.map((s) => (
            <span key={s.skill_name} className="rounded-full border px-3 py-1 text-xs sm:text-sm">
              {s.skill_name} <span className="text-gray-400">({s.demand_count})</span>
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-10 sm:mt-12 rounded-xl bg-blue-50 p-6 sm:p-8 text-center">
        <h2 className="text-lg sm:text-xl font-bold">Get 3x More Interviews</h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          AI analyzes your skills, finds the best jobs, and auto-applies with a tailored resume.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 min-h-[44px] w-full sm:w-auto active:scale-[0.98] transition-transform text-sm sm:text-base"
        >
          Start Free — No Credit Card
        </Link>
      </section>

      <footer className="mt-6 sm:mt-8 border-t pt-6 text-center text-xs sm:text-sm text-gray-400">
        Data sourced from job postings on our platform. Updated monthly. &copy; {new Date().getFullYear()} AI Job Assistant
      </footer>
    </div>
  );
}
