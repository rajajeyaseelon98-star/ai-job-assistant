import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidUUID } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  if (!isValidUUID(jobId)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.profile?.role !== "job_seeker") {
    return NextResponse.json({ error: "Only job seekers can apply to jobs" }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { resume_id, cover_letter } = body as {
    resume_id?: string;
    cover_letter?: string;
  };

  if (resume_id && !isValidUUID(resume_id)) {
    return NextResponse.json({ error: "Invalid resume ID" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch the job to confirm it's active and get recruiter_id
  const { data: job, error: jobError } = await supabase
    .from("job_postings")
    .select("id, recruiter_id, status")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "active") {
    return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 400 });
  }

  // If resume_id provided, fetch the parsed text
  let resumeText: string | null = null;
  if (resume_id) {
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("id, parsed_text")
      .eq("id", resume_id)
      .eq("user_id", user.id)
      .single();

    if (resumeError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    resumeText = resume.parsed_text || null;
  }

  // Insert the application
  const { data: application, error: insertError } = await supabase
    .from("job_applications")
    .insert({
      job_id: jobId,
      candidate_id: user.id,
      recruiter_id: job.recruiter_id,
      resume_id: resume_id || null,
      resume_text: resumeText,
      cover_letter: cover_letter?.trim().slice(0, 5000) || null,
      stage: "applied",
    })
    .select()
    .single();

  if (insertError) {
    // Handle unique constraint violation (already applied)
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 409 }
      );
    }
    console.error("Insert job application error:", insertError);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }

  // Atomically increment application_count via Postgres RPC
  const { error: countError } = await supabase.rpc("increment_application_count", {
    posting_id: jobId,
  });

  if (countError) {
    // Fallback: non-atomic increment (acceptable for a display counter)
    const { data: current } = await supabase
      .from("job_postings")
      .select("application_count")
      .eq("id", jobId)
      .single();
    await supabase
      .from("job_postings")
      .update({ application_count: (current?.application_count || 0) + 1 })
      .eq("id", jobId);
  }

  return NextResponse.json(application, { status: 201 });
}
