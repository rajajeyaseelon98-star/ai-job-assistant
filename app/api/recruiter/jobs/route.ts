import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: memberships, error: mErr } = await supabase
    .from("company_memberships")
    .select("company_id,status")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (mErr) {
    return NextResponse.json({ error: "Failed to load memberships" }, { status: 500 });
  }
  const companyIds = (memberships || [])
    .map((m) => (m as { company_id: string }).company_id)
    .filter(Boolean);
  if (!companyIds.length) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("job_postings")
    .select("*")
    .in("company_id", companyIds)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load job postings" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    title,
    description,
    requirements,
    skills_required,
    experience_min,
    experience_max,
    salary_min,
    salary_max,
    salary_currency,
    location,
    work_type,
    employment_type,
    status,
    company_id,
  } = body as {
    title?: string;
    description?: string;
    requirements?: string;
    skills_required?: string[];
    experience_min?: number;
    experience_max?: number;
    salary_min?: number;
    salary_max?: number;
    salary_currency?: string;
    location?: string;
    work_type?: string;
    employment_type?: string;
    status?: string;
    company_id?: string;
  };

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 });
  }

  const validWorkTypes = ["onsite", "remote", "hybrid"];
  const validEmploymentTypes = ["full_time", "part_time", "contract", "internship"];
  const validStatuses = ["draft", "active", "paused", "closed"];

  const workTypeVal = validWorkTypes.includes(work_type || "") ? work_type : "onsite";
  const employmentTypeVal = validEmploymentTypes.includes(employment_type || "")
    ? employment_type
    : "full_time";
  const statusVal = validStatuses.includes(status || "") ? status : "draft";

  const supabase = await createClient();

  // Default company_id to the recruiter's first active membership.
  let effectiveCompanyId = company_id || null;
  if (!effectiveCompanyId) {
    const { data: memberships, error: mErr } = await supabase
      .from("company_memberships")
      .select("company_id,status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);
    if (mErr) return NextResponse.json({ error: "Failed to resolve company" }, { status: 500 });
    effectiveCompanyId = (memberships?.[0] as { company_id: string } | undefined)?.company_id || null;
  }
  if (!effectiveCompanyId) {
    return NextResponse.json(
      { error: "Create a company before posting jobs" },
      { status: 400 }
    );
  }

  // Enforce plan limits for active job postings.
  if (statusVal === "active") {
    const [{ data: company }, { count: activeCount }] = await Promise.all([
      supabase.from("companies").select("id,max_active_jobs").eq("id", effectiveCompanyId).maybeSingle(),
      supabase
        .from("job_postings")
        .select("id", { count: "exact", head: true })
        .eq("company_id", effectiveCompanyId)
        .eq("status", "active"),
    ]);
    const maxActiveJobs = (company as { max_active_jobs?: number } | null | undefined)?.max_active_jobs ?? 3;
    if (maxActiveJobs !== -1 && (activeCount ?? 0) >= maxActiveJobs) {
      return NextResponse.json(
        { error: `Plan limit reached: max ${maxActiveJobs} active job postings.` },
        { status: 402 }
      );
    }
  }

  const { data, error } = await supabase
    .from("job_postings")
    .insert({
      recruiter_id: user.id,
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 10000),
      requirements: requirements?.trim().slice(0, 5000) || null,
      skills_required: Array.isArray(skills_required)
        ? skills_required.map((s) => String(s).trim().slice(0, 100)).slice(0, 50)
        : null,
      experience_min:
        typeof experience_min === "number" && experience_min >= 0 ? experience_min : null,
      experience_max:
        typeof experience_max === "number" && experience_max >= 0 ? experience_max : null,
      salary_min: typeof salary_min === "number" && salary_min >= 0 ? salary_min : null,
      salary_max: typeof salary_max === "number" && salary_max >= 0 ? salary_max : null,
      salary_currency: salary_currency?.trim().slice(0, 10) || null,
      location: location?.trim().slice(0, 200) || null,
      work_type: workTypeVal,
      employment_type: employmentTypeVal,
      status: statusVal,
      company_id: effectiveCompanyId,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert job posting error:", error);
    return NextResponse.json({ error: "Failed to create job posting" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
