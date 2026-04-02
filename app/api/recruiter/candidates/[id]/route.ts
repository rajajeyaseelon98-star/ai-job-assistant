import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validation";

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
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: candidate, error } = await supabase
    .from("users")
    .select(`
      id, email, name, created_at,
      resumes(
        id, parsed_text, file_url, created_at,
        resume_analysis(id, score, analysis_json, created_at)
      ),
      user_preferences(experience_level, preferred_role, preferred_location, salary_expectation)
    `)
    .eq("id", id)
    .eq("role", "job_seeker")
    .single();

  if (error) {
    console.error("[recruiter/candidates/[id]]", error.message);
    return NextResponse.json(
      { error: "Candidate not found", detail: error.message },
      { status: 404 }
    );
  }
  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  return NextResponse.json(candidate);
}
