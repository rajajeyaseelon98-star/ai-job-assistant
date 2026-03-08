import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { HistoryResumeSection } from "./HistoryResumeSection";
import { HistoryJobMatchSection } from "./HistoryJobMatchSection";
import { HistoryCoverLetterSection } from "./HistoryCoverLetterSection";
import { HistoryImprovedResumeSection } from "./HistoryImprovedResumeSection";

export default async function HistoryPage() {
  const supabase = await createClient();

  const { data: analyses } = await supabase
    .from("resume_analysis")
    .select("id, score, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: matches } = await supabase
    .from("job_matches")
    .select("id, match_score, job_title, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: coverLetters } = await supabase
    .from("cover_letters")
    .select("id, company_name, job_title, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: improvedResumes } = await supabase
    .from("improved_resumes")
    .select("id, job_title, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-text">History</h1>
      <p className="text-text-muted">
        Your resume analyses, job matches, improved resumes, and cover letters.
      </p>

      <HistoryResumeSection items={analyses ?? []} />
      <HistoryJobMatchSection items={matches ?? []} />
      <HistoryImprovedResumeSection items={improvedResumes ?? []} />
      <HistoryCoverLetterSection items={coverLetters ?? []} />
    </div>
  );
}
