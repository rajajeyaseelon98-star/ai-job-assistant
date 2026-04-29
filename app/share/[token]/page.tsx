import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface ScoreData {
  atsScore: number;
  missingSkills: string[];
  recommendedRoles: string[];
}

/** Generate OG meta tags for social sharing (LinkedIn, Twitter, etc.) */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();

  const { data: analysis } = await supabase
    .from("resume_analysis")
    .select("score, analysis_json")
    .eq("share_token", token)
    .single();

  if (!analysis) {
    return { title: "Resume Score | AI Job Assistant" };
  }

  const score = analysis.score ?? 0;
  const data = (analysis.analysis_json || {}) as unknown as ScoreData;
  const roles = data.recommendedRoles || [];
  const rolesText = roles.length > 0 ? ` | Best fit: ${roles.slice(0, 3).join(", ")}` : "";

  const title = `My ATS Resume Score: ${score}/100`;
  const description = `I scored ${score}/100 on my ATS resume analysis.${rolesText} — Check yours at AI Job Assistant!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "AI Job Assistant",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: analysis } = await supabase
    .from("resume_analysis")
    .select("score, analysis_json, created_at")
    .eq("share_token", token)
    .single();

  if (!analysis) {
    notFound();
  }

  const score = analysis.score ?? 0;
  const data = (analysis.analysis_json || {}) as unknown as ScoreData;
  const roles = data.recommendedRoles || [];

  const scoreColor =
    score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
  const scoreBg =
    score >= 80 ? "bg-green-100" : score >= 60 ? "bg-yellow-100" : "bg-red-100";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-4 sm:space-y-6 rounded-2xl bg-white p-5 sm:p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">ATS Resume Score</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Analyzed on {new Date(analysis.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex justify-center">
          <div className={`flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full ${scoreBg}`}>
            <span className={`text-3xl sm:text-4xl font-bold ${scoreColor}`}>{score}</span>
          </div>
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-600">
          {score >= 80
            ? "Excellent! This resume is well-optimized for ATS systems."
            : score >= 60
              ? "Good score with room for improvement."
              : "This resume needs significant improvements for ATS compatibility."}
        </p>

        {roles.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Recommended Roles</h3>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-400">
            Created with AI Job Assistant
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 min-h-[44px] w-full sm:w-auto active:scale-[0.98] transition-transform"
          >
            Analyze Your Resume
          </Link>
        </div>
      </div>
    </div>
  );
}
