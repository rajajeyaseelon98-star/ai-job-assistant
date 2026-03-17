import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_postings")
    .select(
      "id, recruiter_id, title, description, requirements, skills_required, experience_min, experience_max, salary_min, salary_max, salary_currency, location, work_type, employment_type, application_count, created_at, companies:company_id(id, name, description, website, logo_url, industry, location)"
    )
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
