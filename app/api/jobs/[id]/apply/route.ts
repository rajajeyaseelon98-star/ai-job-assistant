import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidUUID } from "@/lib/validation";
import { getImprovedResumePlainTextForUser, getResumeForJobApplication } from "@/lib/resume-for-user";
import { createNotificationForUser } from "@/lib/notifications";
import { getAppBaseUrl } from "@/lib/appUrl";
import { sendEmail } from "@/lib/email";
import { applicationReceivedEmailTemplate } from "@/lib/emailTemplates";
import { createServiceRoleClient } from "@/lib/supabase/admin";

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

  const { resume_id, improved_resume_id, cover_letter } = body as {
    resume_id?: string;
    improved_resume_id?: string;
    cover_letter?: string;
  };

  if (resume_id && improved_resume_id) {
    return NextResponse.json(
      { error: "Use only one of resume_id or improved_resume_id" },
      { status: 400 }
    );
  }

  if (resume_id && !isValidUUID(resume_id)) {
    return NextResponse.json({ error: "Invalid resume ID" }, { status: 400 });
  }

  if (improved_resume_id && !isValidUUID(improved_resume_id)) {
    return NextResponse.json({ error: "Invalid improved resume ID" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch the job to confirm it's active and get recruiter_id
  const { data: job, error: jobError } = await supabase
    .from("job_postings")
    .select("id, recruiter_id, company_id, status, title")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "active") {
    return NextResponse.json({ error: "This job is no longer accepting applications" }, { status: 400 });
  }

  let resumeText: string | null = null;
  /** FK to `resumes` when applying with an upload, or when improved resume was derived from one */
  let applicationResumeId: string | null = null;

  if (resume_id) {
    const loaded = await getResumeForJobApplication(supabase, user.id, resume_id);
    if (!loaded.ok) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }
    resumeText = loaded.text;
    applicationResumeId = resume_id;
  } else if (improved_resume_id) {
    const loaded = await getImprovedResumePlainTextForUser(supabase, user.id, improved_resume_id);
    if (!loaded.ok) {
      if (loaded.reason === "not_found") {
        return NextResponse.json({ error: "Improved resume not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Improved resume has no usable text. Try re-generating it in Resume Analyzer." },
        { status: 400 }
      );
    }
    resumeText = loaded.text;
    applicationResumeId = loaded.underlying_resume_id;
  }

  // Insert the application
  const { data: application, error: insertError } = await supabase
    .from("job_applications")
    .insert({
      job_id: jobId,
      candidate_id: user.id,
      recruiter_id: job.recruiter_id,
      resume_id: applicationResumeId,
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

  // Notify company recruiters (best-effort; do not fail the application if notifications can't be delivered).
  try {
    const companyId = job.company_id as string | null | undefined;
    if (companyId) {
      const { data: members } = await supabase
        .from("company_memberships")
        .select("user_id,status")
        .eq("company_id", companyId)
        .eq("status", "active");
      const targets = (members || [])
        .map((m) => (m as { user_id: string }).user_id)
        .filter(Boolean);
      await Promise.all(
        targets.map((targetUserId) =>
          createNotificationForUser(
            targetUserId,
            "application",
            "New application received",
            `${user.email} applied to “${String(job.title || "a job")}”.`,
            { job_id: jobId, application_id: application.id, candidate_id: user.id }
          )
        )
      );

      // Optional: email recruiters (Phase 6 follow-up, gated).
      try {
        const admin = createServiceRoleClient();
        if (!admin) {
          // Service role required to resolve recruiter emails; skip silently.
        } else {
          const baseUrl = await getAppBaseUrl();
          const applicationUrl = `${baseUrl}/recruiter/applications?applicationId=${encodeURIComponent(
            application.id
          )}`;
          const { data: companyRow } = await supabase
            .from("companies")
            .select("id,name")
            .eq("id", companyId)
            .maybeSingle();
          const companyName = String(
            (companyRow as { name?: string } | null | undefined)?.name || "your company"
          );

          // Fetch emails for targets (service role, to avoid RLS issues)
          const { data: profiles } = await admin
            .from("users")
            .select("id,email")
            .in("id", targets);
          const emails = (profiles || [])
            .map((p) => (p as { email?: string }).email)
            .filter((e): e is string => typeof e === "string" && e.includes("@"));

          const tpl = applicationReceivedEmailTemplate({
            companyName,
            jobTitle: String(job.title || "a job"),
            candidateEmail: user.email,
            applicationUrl,
          });

          await Promise.all(
            emails.map((to) =>
              sendEmail({
                to,
                subject: tpl.subject,
                html: tpl.html,
                text: tpl.text,
                category: "marketplace",
              })
            )
          );
        }
      }
      catch (e) {
        console.warn("[apply] recruiter email dispatch failed", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    } else {
      // Fallback: notify the recruiter_id owner.
      await createNotificationForUser(
        job.recruiter_id,
        "application",
        "New application received",
        `${user.email} applied to your job.`,
        { job_id: jobId, application_id: application.id, candidate_id: user.id }
      );
    }
  } catch (e) {
    console.warn("[apply] notification dispatch failed", {
      error: e instanceof Error ? e.message : String(e),
    });
  }

  return NextResponse.json(application, { status: 201 });
}
