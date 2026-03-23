import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HistoryResumeSection } from "./HistoryResumeSection";
import { HistoryJobMatchSection } from "./HistoryJobMatchSection";
import { HistoryCoverLetterSection } from "./HistoryCoverLetterSection";
import { HistoryImprovedResumeSection } from "./HistoryImprovedResumeSection";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: analyses } = await supabase
    .from("resume_analysis")
    .select("id, score, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: matches } = await supabase
    .from("job_matches")
    .select("id, match_score, job_title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: coverLetters } = await supabase
    .from("cover_letters")
    .select("id, company_name, job_title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: improvedResumes, error: improvedResumesError } = await supabase
    .from("improved_resumes")
    .select("id, job_title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-4xl mx-auto w-full py-8 space-y-4 sm:space-y-6 md:space-y-8">
      <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">History</h1>
      <p className="text-slate-500 text-sm mt-2">
        Your resume analyses, job matches, improved resumes, and cover letters.
      </p>

      <HistoryResumeSection items={analyses ?? []} />
      <HistoryJobMatchSection items={matches ?? []} />
      <HistoryImprovedResumeSection
        items={improvedResumes ?? []}
        loadError={improvedResumesError?.message}
      />
      <HistoryCoverLetterSection items={coverLetters ?? []} />
    </div>
  );
}
