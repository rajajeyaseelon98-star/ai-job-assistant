import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!isValidUUID(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resume_analysis")
    .select("id, score, analysis_json, created_at, resume_id")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let resume_text: string | null = null;
  if (data.resume_id) {
    const { data: resume } = await supabase
      .from("resumes")
      .select("parsed_text")
      .eq("id", data.resume_id)
      .single();
    resume_text = resume?.parsed_text ?? null;
  }

  return NextResponse.json({
    id: data.id,
    score: data.score,
    analysis_json: data.analysis_json,
    created_at: data.created_at,
    resume_text,
    resume_id: data.resume_id ?? null,
  });
}
