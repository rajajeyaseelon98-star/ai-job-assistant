import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface SharedData {
  share_type: string;
  share_data: Record<string, unknown>;
  user_name: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("data")
    .contains("data", { share_token: token })
    .single();

  if (!data?.data) return { title: "Shared Result | AI Job Assistant" };

  const d = data.data as SharedData;
  const shareData = d.share_data || {};
  const userName = d.user_name || "Someone";

  if (d.share_type === "interview_probability") {
    const score = shareData.score as number || 0;
    const level = shareData.level as string || "MEDIUM";
    return {
      title: `${userName}'s Interview Probability: ${score}% (${level}) | AI Job Assistant`,
      description: `${userName} has a ${score}% interview probability. Check yours free!`,
      openGraph: {
        title: `Interview Probability: ${score}% (${level})`,
        description: `${userName} has a ${score}% interview probability for their target role.`,
        type: "website",
        siteName: "AI Job Assistant",
      },
    };
  }

  if (d.share_type === "hiring_benchmark") {
    const percentile = shareData.percentile as number || 0;
    return {
      title: `${userName} is in the top ${100 - percentile}% of candidates | AI Job Assistant`,
      description: `${userName}'s profile is stronger than ${percentile}% of candidates. How do you compare?`,
      openGraph: {
        title: `Top ${100 - percentile}% Candidate`,
        description: `This candidate outperforms ${percentile}% of all profiles on AI Job Assistant.`,
        type: "website",
        siteName: "AI Job Assistant",
      },
    };
  }

  return { title: "Shared Result | AI Job Assistant" };
}

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("notifications")
    .select("data, created_at")
    .contains("data", { share_token: token })
    .single();

  if (!data?.data) notFound();

  const d = data.data as SharedData;
  const shareData = d.share_data || {};
  const userName = d.user_name || "A candidate";
  const createdAt = new Date(data.created_at).toLocaleDateString();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-lg">
        {d.share_type === "interview_probability" && (
          <InterviewProbabilityCard
            userName={userName}
            score={shareData.score as number}
            level={shareData.level as string}
            reasons={shareData.reasons as string[]}
            jobTitle={shareData.job_title as string}
            date={createdAt}
          />
        )}

        {d.share_type === "hiring_benchmark" && (
          <HiringBenchmarkCard
            userName={userName}
            percentile={shareData.percentile as number}
            yourScore={shareData.your_score as number}
            topFactor={shareData.top_factor as string}
            date={createdAt}
          />
        )}

        {d.share_type === "ats_score" && (
          <ATSScoreCard
            userName={userName}
            score={shareData.score as number}
            roles={shareData.roles as string[]}
            date={createdAt}
          />
        )}

        {/* CTA */}
        <div className="border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-400">Created with AI Job Assistant</p>
          <Link
            href="/signup"
            className="mt-3 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Check Your Score Free
          </Link>
        </div>
      </div>
    </div>
  );
}

function InterviewProbabilityCard({
  userName, score, level, reasons, jobTitle, date,
}: {
  userName: string; score: number; level: string; reasons?: string[]; jobTitle?: string; date: string;
}) {
  const color = level === "HIGH" ? "text-green-600 bg-green-100" : level === "MEDIUM" ? "text-yellow-600 bg-yellow-100" : "text-red-600 bg-red-100";

  return (
    <>
      <div className="text-center">
        <h1 className="text-lg font-bold text-gray-900">Interview Probability</h1>
        <p className="text-sm text-gray-500">{userName}{jobTitle ? ` for ${jobTitle}` : ""}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <div className="flex justify-center">
        <div className={`flex h-28 w-28 items-center justify-center rounded-full ${color}`}>
          <div className="text-center">
            <span className="text-3xl font-bold">{score}%</span>
            <div className="text-xs font-medium">{level}</div>
          </div>
        </div>
      </div>
      {reasons && reasons.length > 0 && (
        <ul className="space-y-1 text-sm text-gray-600">
          {reasons.slice(0, 3).map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-green-500">+</span> {r}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function HiringBenchmarkCard({
  userName, percentile, yourScore, topFactor, date,
}: {
  userName: string; percentile: number; yourScore: number; topFactor?: string; date: string;
}) {
  const topPct = 100 - percentile;
  return (
    <>
      <div className="text-center">
        <h1 className="text-lg font-bold text-gray-900">Hiring Benchmark</h1>
        <p className="text-sm text-gray-500">{userName}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <div className="flex justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-purple-100 text-purple-600">
          <div className="text-center">
            <span className="text-3xl font-bold">Top {topPct}%</span>
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Profile is stronger than <strong>{percentile}%</strong> of all candidates
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Score: <strong>{yourScore}/100</strong>
        </p>
      </div>
      {topFactor && (
        <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 text-center">{topFactor}</p>
      )}
    </>
  );
}

function ATSScoreCard({
  userName, score, roles, date,
}: {
  userName: string; score: number; roles?: string[]; date: string;
}) {
  const color = score >= 80 ? "text-green-600 bg-green-100" : score >= 60 ? "text-yellow-600 bg-yellow-100" : "text-red-600 bg-red-100";

  return (
    <>
      <div className="text-center">
        <h1 className="text-lg font-bold text-gray-900">ATS Resume Score</h1>
        <p className="text-sm text-gray-500">{userName}</p>
        <p className="text-xs text-gray-400">{date}</p>
      </div>
      <div className="flex justify-center">
        <div className={`flex h-28 w-28 items-center justify-center rounded-full ${color}`}>
          <span className="text-4xl font-bold">{score}</span>
        </div>
      </div>
      {roles && roles.length > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500">Best fit roles:</p>
          <div className="mt-1 flex flex-wrap justify-center gap-1">
            {roles.slice(0, 4).map((r) => (
              <span key={r} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{r}</span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
