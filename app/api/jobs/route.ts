import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search")?.trim() || "";
  const location = searchParams.get("location")?.trim() || "";
  const workType = searchParams.get("work_type")?.trim() || "";
  const employmentType = searchParams.get("employment_type")?.trim() || "";
  const skills = searchParams.get("skills")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  let query = supabase
    .from("job_postings")
    .select(
      "id, title, description, requirements, skills_required, experience_min, experience_max, salary_min, salary_max, salary_currency, location, work_type, employment_type, application_count, created_at, companies:company_id(id, name, logo_url, industry, location)",
      { count: "exact" }
    )
    .eq("status", "active");

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (location) {
    query = query.ilike("location", `%${location}%`);
  }

  const validWorkTypes = ["onsite", "remote", "hybrid"];
  if (workType && validWorkTypes.includes(workType)) {
    query = query.eq("work_type", workType);
  }

  const validEmploymentTypes = ["full_time", "part_time", "contract", "internship"];
  if (employmentType && validEmploymentTypes.includes(employmentType)) {
    query = query.eq("employment_type", employmentType);
  }

  if (skills) {
    const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (skillList.length > 0) {
      query = query.contains("skills_required", skillList);
    }
  }

  query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("List jobs error:", error);
    return NextResponse.json({ error: "Failed to load jobs" }, { status: 500 });
  }

  return NextResponse.json({
    jobs: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}
