import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HistoryPage() {
  const supabase = await createClient();

  const { data: analyses } = await supabase
    .from("resume_analysis")
    .select("id, score, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: matches } = await supabase
    .from("job_matches")
    .select("id, match_score, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const analysisItems = (analyses ?? []).map((a) => ({
    id: a.id,
    type: "resume_analysis" as const,
    title: "Resume analysis",
    subtitle: `ATS Score ${a.score}`,
    date: new Date(a.created_at).toLocaleDateString(),
    href: "/resume-analyzer",
  }));
  const matchItems = (matches ?? []).map((m) => ({
    id: m.id,
    type: "job_match" as const,
    title: "Job match",
    subtitle: `Match ${m.match_score}%`,
    date: new Date(m.created_at).toLocaleDateString(),
    href: "/job-match",
  }));
  const combined = [...analysisItems, ...matchItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">History</h1>
      <p className="text-text-muted">
        Your recent resume analyses and job matches.
      </p>

      <div className="rounded-xl border border-gray-200 bg-card shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="font-semibold text-text">Recent activity</h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {combined.length === 0 ? (
            <li className="px-6 py-8 text-center text-sm text-text-muted">
              No activity yet. Analyze a resume or match a job to get started.
            </li>
          ) : (
            combined.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="font-medium text-text">{item.title}</p>
                  <p className="text-sm text-text-muted">{item.subtitle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-text-muted">{item.date}</span>
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
