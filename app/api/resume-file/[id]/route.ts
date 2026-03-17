import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validation";

/**
 * GET /api/resume-file/[id]
 * Returns a short-lived signed URL (15 min) for downloading a resume file.
 * Generates on-demand so stored paths never expire.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid resume ID" }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch resume and verify ownership
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, file_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!resume || !resume.file_url) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const storagePath = resume.file_url;

  // If file_url is already a full URL (legacy signed URLs), return it directly
  if (storagePath.startsWith("http")) {
    return NextResponse.json({ url: storagePath });
  }

  // Generate a short-lived signed URL (15 minutes)
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(storagePath, 60 * 15);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}
