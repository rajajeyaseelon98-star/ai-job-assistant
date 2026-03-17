import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const jobId = url.searchParams.get("job_id");
  const stage = url.searchParams.get("stage");

  const supabase = await createClient();
  let query = supabase
    .from("job_applications")
    .select(`
      *,
      candidate:users!job_applications_candidate_id_fkey(id, email, name),
      job:job_postings!job_applications_job_id_fkey(id, title, company_id)
    `)
    .eq("recruiter_id", user.id)
    .order("created_at", { ascending: false });

  if (jobId) query = query.eq("job_id", jobId);
  if (stage) query = query.eq("stage", stage);

  const { data, error } = await query.limit(200);

  if (error) {
    console.error("List applications error:", error);
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
