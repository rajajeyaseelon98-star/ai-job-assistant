import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validation";
import { createNotificationForUser } from "@/lib/notifications";
import { getAppBaseUrl } from "@/lib/appUrl.server";
import { sendEmail } from "@/lib/email";
import { applicationStatusChangedEmailTemplate } from "@/lib/emailTemplates";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select(`
      *,
      candidate:users!job_applications_candidate_id_fkey(id, email, name),
      job:job_postings!job_applications_job_id_fkey(id, title, description, skills_required)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validStages = ["applied", "shortlisted", "interview_scheduled", "interviewed", "offer_sent", "hired", "rejected"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  const requestedStage =
    typeof body.stage === "string" && validStages.includes(body.stage) ? body.stage : null;
  if (requestedStage) updates.stage = requestedStage;
  if (typeof body.recruiter_notes === "string")
    updates.recruiter_notes = (body.recruiter_notes as string).trim().slice(0, 5000);
  if (typeof body.recruiter_rating === "number" && body.recruiter_rating >= 1 && body.recruiter_rating <= 5)
    updates.recruiter_rating = body.recruiter_rating;
  if (typeof body.interview_date === "string")
    updates.interview_date = body.interview_date || null;
  if (typeof body.interview_notes === "string")
    updates.interview_notes = (body.interview_notes as string).trim().slice(0, 5000);

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("job_applications")
    .select("id, stage, recruiter_notes, candidate_id")
    .eq("id", id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("job_applications")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  // Timeline event (best-effort; non-fatal)
  const fromStage = (before as Record<string, unknown> | null | undefined)?.stage as string | undefined;
  const didStageChange = requestedStage && fromStage && requestedStage !== fromStage;
  const didNotesChange =
    typeof body.recruiter_notes === "string" &&
    String((before as Record<string, unknown> | null | undefined)?.recruiter_notes ?? "") !==
      (body.recruiter_notes as string).trim().slice(0, 5000);

  if (didStageChange || didNotesChange) {
    const eventType = didStageChange ? "status_change" : "note_added";
    await supabase.from("application_events").insert({
      application_id: id,
      actor_user_id: user.id,
      event_type: eventType,
      from_stage: didStageChange ? fromStage : null,
      to_stage: didStageChange ? requestedStage : null,
      meta: didNotesChange ? { notes: "updated" } : {},
    });
  }

  // Notify candidate on stage change (best-effort; doesn't block recruiter action).
  if (didStageChange) {
    const candidateId = (before as Record<string, unknown> | null | undefined)?.candidate_id as
      | string
      | undefined;
    if (candidateId) {
      try {
        await createNotificationForUser(
          candidateId,
          "application",
          "Application status updated",
          `Your application moved to “${String(requestedStage)}”.`,
          { application_id: id, to_stage: requestedStage, from_stage: fromStage }
        );
      } catch (e) {
        console.warn("[recruiter-applications] failed to notify candidate", {
          candidateId,
          error: e instanceof Error ? e.message : String(e),
        });
      }

      // Optional: email candidate (Phase 6 follow-up, gated).
      try {
        const admin = createServiceRoleClient();
        if (!admin) {
          // Service role required for cross-user email lookup; skip silently.
        } else {
          const baseUrl = await getAppBaseUrl();
          const applicationUrl = `${baseUrl}/applications?applicationId=${encodeURIComponent(id)}`;

          const [{ data: userRow }, { data: appRow }] = await Promise.all([
            admin.from("users").select("email").eq("id", candidateId).maybeSingle(),
            admin.from("job_applications").select("job_id").eq("id", id).maybeSingle(),
          ]);
          const toEmail = String((userRow as { email?: string } | null | undefined)?.email || "");
          const jobId = String((appRow as { job_id?: string } | null | undefined)?.job_id || "");
          if (!toEmail.includes("@") || !jobId) return;

          const { data: jobRow } = await admin.from("job_postings").select("title").eq("id", jobId).maybeSingle();
          const jobTitle = String((jobRow as { title?: string } | null | undefined)?.title || "your job");

          const tpl = applicationStatusChangedEmailTemplate({
            jobTitle,
            fromStage: String(fromStage || "applied"),
            toStage: String(requestedStage || ""),
            applicationUrl,
          });
          await sendEmail({
            to: toEmail,
            subject: tpl.subject,
            html: tpl.html,
            text: tpl.text,
            category: "marketplace",
            eventType: "application_stage_changed_candidate",
            idempotencyKey: `application:${id}:candidate:${toEmail}:stage:${String(requestedStage)}`,
            meta: {
              application_id: id,
              candidate_id: candidateId,
              from_stage: fromStage,
              to_stage: requestedStage,
            },
          });
        }
      } catch (e) {
        console.warn("[recruiter-applications] candidate email dispatch failed", {
          candidateId,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: "Delete failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
