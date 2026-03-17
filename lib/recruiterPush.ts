import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

export type PushType = "job_invite" | "interview_request" | "profile_view" | "shortlisted";

export interface RecruiterPush {
  id: string;
  recruiter_id: string;
  candidate_id: string;
  job_id: string | null;
  push_type: PushType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

/**
 * Send a push notification from recruiter to candidate.
 * Also creates a regular notification so it shows in the bell.
 */
export async function sendRecruiterPush(
  recruiterId: string,
  candidateId: string,
  pushType: PushType,
  title: string,
  message: string,
  jobId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Rate limit: max 10 pushes per recruiter per day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("recruiter_pushes")
    .select("*", { count: "exact", head: true })
    .eq("recruiter_id", recruiterId)
    .gte("created_at", today.toISOString());

  if ((count || 0) >= 10) {
    return { success: false, error: "Daily push limit reached (10/day)" };
  }

  // Insert push record
  const { error } = await supabase.from("recruiter_pushes").insert({
    recruiter_id: recruiterId,
    candidate_id: candidateId,
    job_id: jobId || null,
    push_type: pushType,
    title,
    message,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Also create a regular notification for the candidate
  await createNotification(
    candidateId,
    "message",
    title,
    message,
    { push_type: pushType, recruiter_id: recruiterId, job_id: jobId }
  );

  return { success: true };
}

/**
 * Get pushes received by a candidate.
 */
export async function getCandidatePushes(
  candidateId: string,
  limit = 20
): Promise<RecruiterPush[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recruiter_pushes")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as RecruiterPush[];
}

/**
 * Mark a push as read.
 */
export async function markPushRead(pushId: string, candidateId: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("recruiter_pushes")
    .update({ read: true })
    .eq("id", pushId)
    .eq("candidate_id", candidateId);
}
