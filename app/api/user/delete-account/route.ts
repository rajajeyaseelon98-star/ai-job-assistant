import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Deletes current user's data from all tables and signs out. */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();

  // Delete related data first (in case CASCADE is not configured)
  await Promise.all([
    supabase.from("usage_logs").delete().eq("user_id", user.id),
    supabase.from("interview_sessions").delete().eq("user_id", user.id),
    supabase.from("cover_letters").delete().eq("user_id", user.id),
    supabase.from("improved_resumes").delete().eq("user_id", user.id),
    supabase.from("job_matches").delete().eq("user_id", user.id),
    supabase.from("user_preferences").delete().eq("user_id", user.id),
  ]);
  // resume_analysis references resumes, delete analyses first
  const { data: resumes } = await supabase.from("resumes").select("id").eq("user_id", user.id);
  if (resumes?.length) {
    const resumeIds = resumes.map((r) => r.id);
    await supabase.from("resume_analysis").delete().in("resume_id", resumeIds);
  }
  await supabase.from("resumes").delete().eq("user_id", user.id);
  await supabase.from("users").delete().eq("id", user.id);
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
