import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import type { AutoApplyJobResult } from "@/types/autoApply";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: run } = await supabase
    .from("auto_apply_runs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!run || !["ready_for_review", "confirmed"].includes(run.status as string)) {
    return NextResponse.json({ error: "Run not found or already completed" }, { status: 400 });
  }

  const results = (run.results || []) as AutoApplyJobResult[];
  const selectedJobs = results.filter((r) => r.selected && !r.applied);

  if (selectedJobs.length === 0) {
    return NextResponse.json({ error: "No jobs selected to apply" }, { status: 400 });
  }

  // Create application records for selected jobs (unified for internal + external)
  let appliedCount = 0;
  const failedItems: Array<{ jobId: string; title: string; reason: string }> = [];
  const today = new Date().toISOString().split("T")[0];
  for (const job of selectedJobs) {
    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      role: job.title,
      company: job.company,
      status: "applied",
      url: job.url || null,
      notes: `Auto-applied via AI Auto-Apply (${job.source}).\nMatch score: ${job.match_score}%\n${job.match_reason}`,
      applied_date: today,
    });
    if (!error) {
      appliedCount++;
      job.applied = true;
    }
    if (error) {
      failedItems.push({
        jobId: job.job_id,
        title: job.title,
        reason: error.message,
      });
      job.applied = false;
    }
  }

  // Update run
  await supabase
    .from("auto_apply_runs")
    .update({
      status: "completed",
      results,
      jobs_applied: (run.jobs_applied || 0) + appliedCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  // Create notification
  await createNotification(
    user.id,
    "auto_apply",
    `${appliedCount} new application${appliedCount !== 1 ? "s" : ""} sent!`,
    `You just applied to ${appliedCount} high-match job${appliedCount !== 1 ? "s" : ""}. Your next interview could be around the corner!`,
    { run_id: id, applied_count: appliedCount }
  );

  return NextResponse.json({
    success: true,
    applied_count: appliedCount,
    total_selected: selectedJobs.length,
    failed_count: failedItems.length,
    failed_items: failedItems,
  });
}
