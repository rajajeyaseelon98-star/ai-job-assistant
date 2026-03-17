import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/jobs/applied
 * Returns an array of job IDs that the current user has applied to.
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json([], { status: 200 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select("job_id")
    .eq("candidate_id", user.id);

  if (error) {
    return NextResponse.json([], { status: 200 });
  }

  const jobIds = (data || []).map((row: { job_id: string }) => row.job_id);
  return NextResponse.json(jobIds);
}
