import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validation";

/**
 * GET /api/recruiter/resumes/[resumeId]/download
 * Short-lived signed URL for a job seeker's resume file (recruiter-only; RLS must allow read).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ resumeId: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const { resumeId } = await params;
  if (!isValidUUID(resumeId)) {
    return NextResponse.json({ error: "Invalid resume ID" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: resume, error } = await supabase
    .from("resumes")
    .select("id, file_url, user_id")
    .eq("id", resumeId)
    .single();

  if (error || !resume?.file_url) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const { data: owner } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", resume.user_id)
    .single();

  if (!owner || owner.role !== "job_seeker") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storagePath = resume.file_url;
  if (storagePath.startsWith("http")) {
    return NextResponse.json({ url: storagePath });
  }

  const { data, error: signErr } = await supabase.storage
    .from("resumes")
    .createSignedUrl(storagePath, 60 * 15);

  if (signErr || !data?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
