import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface JobData {
  id: string;
  title: string;
  description: string;
  requirements: string;
  skills_required: string[];
  experience_min: number;
  experience_max: number;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  location: string;
  work_type: string;
  employment_type: string;
  application_count: number;
  created_at: string;
  companies: { name: string; industry: string; location: string } | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** SEO metadata for job pages */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split("-");
  const jobId = parts[parts.length - 1];

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("job_postings")
    .select("title, location, companies:company_id(name)")
    .eq("id", jobId)
    .eq("status", "active")
    .single();

  if (!job) return { title: "Job Not Found | AI Job Assistant" };

  const companyObj = job.companies as unknown as { name: string } | { name: string }[] | null;
  const company = companyObj
    ? Array.isArray(companyObj) ? companyObj[0]?.name || "a company" : companyObj.name
    : "a company";

  const title = `${job.title} at ${company} - ${job.location || "Remote"} | AI Job Assistant`;
  const description = `Apply for ${job.title} at ${company} in ${job.location || "Remote"}. Get AI-powered resume matching, interview preparation, and auto-apply features.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "AI Job Assistant" },
    twitter: { card: "summary", title, description },
  };
}

export default async function SEOJobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Extract ID from end of slug (e.g., "react-developer-bangalore-uuid")
  const parts = slug.split("-");
  const jobId = parts[parts.length - 1];

  if (!jobId || jobId.length < 10) notFound();

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("job_postings")
    .select(
      "id, title, description, requirements, skills_required, experience_min, experience_max, salary_min, salary_max, salary_currency, location, work_type, employment_type, application_count, created_at, companies:company_id(name, industry, location)"
    )
    .eq("id", jobId)
    .eq("status", "active")
    .single();

  if (!job) notFound();

  const j = job as unknown as JobData;
  const company = j.companies;
  const postedDate = new Date(j.created_at).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

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
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {/* Job Header */}
          <div className="border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-bold text-gray-900">{j.title}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
              {company && <span className="font-medium">{company.name}</span>}
              {j.location && <span>{j.location}</span>}
              {j.work_type && (
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                  {j.work_type}
                </span>
              )}
              {j.employment_type && (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  {j.employment_type.replace("_", " ")}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Posted {postedDate} | {j.application_count || 0} applicants
            </p>
          </div>

          {/* Salary */}
          {(j.salary_min || j.salary_max) && (
            <div className="mt-4 rounded-lg bg-green-50 p-4">
              <span className="text-sm font-medium text-green-800">Salary: </span>
              <span className="text-sm text-green-700">
                {j.salary_currency || "INR"}{" "}
                {j.salary_min?.toLocaleString()}
                {j.salary_max ? ` - ${j.salary_max.toLocaleString()}` : "+"}
              </span>
            </div>
          )}

          {/* Skills */}
          {j.skills_required && j.skills_required.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900">Required Skills</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {j.skills_required.map((skill) => (
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

          {/* Description */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
            <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
              {j.description}
            </div>
          </div>

          {/* Requirements */}
          {j.requirements && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-900">Requirements</h2>
              <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                {j.requirements}
              </div>
            </div>
          )}

          {/* Experience */}
          {(j.experience_min || j.experience_max) && (
            <div className="mt-4 text-sm text-gray-600">
              Experience: {j.experience_min || 0} - {j.experience_max || "10+"} years
            </div>
          )}

          {/* CTA */}
          <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900">
              Apply with AI-Powered Resume Matching
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Get your match score, interview probability, and AI-tailored cover letter
            </p>
            <Link
              href="/signup"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign Up & Apply Free
            </Link>
          </div>
        </div>

        {/* Related Jobs */}
        <div className="mt-8 text-center">
          <Link href="/jobs" className="text-sm text-blue-600 hover:underline">
            Browse all jobs →
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} AI Job Assistant
      </footer>

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            title: j.title,
            description: j.description?.slice(0, 500),
            datePosted: j.created_at,
            employmentType: j.employment_type?.toUpperCase().replace("_", ""),
            hiringOrganization: company
              ? { "@type": "Organization", name: company.name }
              : undefined,
            jobLocation: j.location
              ? {
                  "@type": "Place",
                  address: { "@type": "PostalAddress", addressLocality: j.location },
                }
              : undefined,
            baseSalary:
              j.salary_min || j.salary_max
                ? {
                    "@type": "MonetaryAmount",
                    currency: j.salary_currency || "INR",
                    value: {
                      "@type": "QuantitativeValue",
                      minValue: j.salary_min,
                      maxValue: j.salary_max,
                      unitText: "YEAR",
                    },
                  }
                : undefined,
          }),
        }}
      />
    </div>
  );
}
