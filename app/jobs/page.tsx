import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Jobs - AI Job Assistant | Find Developer Jobs in India",
  description:
    "Browse thousands of developer jobs in India. Apply with AI-powered resume matching, interview probability scores, and auto-apply features.",
  openGraph: {
    title: "Browse Jobs - AI Job Assistant",
    description: "Find and apply to developer jobs with AI-powered matching.",
    type: "website",
    siteName: "AI Job Assistant",
  },
};

function slugify(text: string, id: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug}-${id}`;
}

export default async function SEOJobsIndexPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("job_postings")
    .select(
      "id, title, location, work_type, salary_min, salary_max, salary_currency, skills_required, application_count, created_at, companies:company_id(name, industry)"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  const jobList = jobs || [];

  // Group by category for SEO internal linking
  const locationSet = new Set<string>();
  const skillSet = new Set<string>();
  for (const job of jobList) {
    if (job.location) locationSet.add(job.location);
    for (const skill of (job.skills_required as string[]) || []) {
      skillSet.add(skill);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-semibold text-blue-600">
            AI Job Assistant
          </Link>
          <nav className="flex gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              Sign Up Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Developer Jobs in India
          </h1>
          <p className="mt-2 text-gray-600">
            {jobList.length} active job{jobList.length !== 1 ? "s" : ""} — Apply with AI-powered resume matching
          </p>
        </div>

        {/* Job Cards */}
        <div className="space-y-4">
          {jobList.map((job) => {
            const companyRaw = job.companies as unknown as { name: string; industry: string } | { name: string; industry: string }[] | null;
            const company = companyRaw
              ? Array.isArray(companyRaw) ? companyRaw[0] || null : companyRaw
              : null;
            const posted = new Date(job.created_at).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            });

            return (
              <Link
                key={job.id}
                href={`/jobs/${slugify(job.title + (job.location ? "-" + job.location : ""), job.id)}`}
                className="block rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600">
                      {company && <span>{company.name}</span>}
                      {job.location && <span>| {job.location}</span>}
                      {job.work_type && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          {job.work_type}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{posted}</span>
                </div>

                {(job.salary_min || job.salary_max) && (
                  <div className="mt-2 text-sm text-green-700">
                    {job.salary_currency || "INR"}{" "}
                    {job.salary_min?.toLocaleString()}
                    {job.salary_max ? ` - ${job.salary_max.toLocaleString()}` : "+"}
                  </div>
                )}

                {(job.skills_required as string[])?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(job.skills_required as string[]).slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-400">
                  {job.application_count || 0} applicants
                </div>
              </Link>
            );
          })}
        </div>

        {jobList.length === 0 && (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">No jobs posted yet</h2>
            <p className="mt-2 text-sm text-gray-600">
              Jobs will appear here as recruiters post them on the platform.
            </p>
          </div>
        )}

        {/* SEO: Popular Skills */}
        {skillSet.size > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900">Popular Skills</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...skillSet].slice(0, 20).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SEO: Popular Locations */}
        {locationSet.size > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">Jobs by Location</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...locationSet].slice(0, 15).map((loc) => (
                <span
                  key={loc}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  {loc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-xl border border-blue-200 bg-blue-50 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            Apply Smarter with AI
          </h2>
          <p className="mt-2 text-gray-600">
            Get AI-matched jobs, interview probability scores, and auto-apply to save hours
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
        © {new Date().getFullYear()} AI Job Assistant | Developer Jobs in India
      </footer>
    </div>
  );
}
