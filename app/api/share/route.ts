import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { analysis_id } = body as { analysis_id?: string };
  if (!analysis_id) {
    return NextResponse.json({ error: "analysis_id required" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify user owns this analysis
  const { data: analysis } = await supabase
    .from("resume_analysis")
    .select("id, share_token, resume_id, resumes!inner(user_id)")
    .eq("id", analysis_id)
    .single();

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  const resumeRow = analysis.resumes as unknown as { user_id: string };
  if (resumeRow.user_id !== user.id) {
    return NextResponse.json({ error: "Not your analysis" }, { status: 403 });
  }

  // Return existing token or generate new one
  if (analysis.share_token) {
    return NextResponse.json({ token: analysis.share_token });
  }

  const token = crypto.randomBytes(16).toString("hex");
  await supabase
    .from("resume_analysis")
    .update({ share_token: token })
    .eq("id", analysis_id);

  return NextResponse.json({ token });
}
