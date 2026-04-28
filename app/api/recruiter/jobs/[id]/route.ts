import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_postings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validWorkTypes = ["onsite", "remote", "hybrid"];
  const validEmploymentTypes = ["full_time", "part_time", "contract", "internship"];
  const validStatuses = ["draft", "active", "paused", "closed"];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string") updates.title = body.title.trim().slice(0, 200);
  if (typeof body.description === "string")
    updates.description = body.description.trim().slice(0, 10000);
  if (typeof body.requirements === "string")
    updates.requirements = body.requirements.trim().slice(0, 5000) || null;
  if (Array.isArray(body.skills_required))
    updates.skills_required = body.skills_required
      .map((s: unknown) => String(s).trim().slice(0, 100))
      .slice(0, 50);
  if (typeof body.experience_min === "number" && body.experience_min >= 0)
    updates.experience_min = body.experience_min;
  if (typeof body.experience_max === "number" && body.experience_max >= 0)
    updates.experience_max = body.experience_max;
  if (typeof body.salary_min === "number" && body.salary_min >= 0)
    updates.salary_min = body.salary_min;
  if (typeof body.salary_max === "number" && body.salary_max >= 0)
    updates.salary_max = body.salary_max;
  if (typeof body.salary_currency === "string")
    updates.salary_currency = body.salary_currency.trim().slice(0, 10) || null;
  if (typeof body.location === "string")
    updates.location = body.location.trim().slice(0, 200) || null;
  if (typeof body.work_type === "string" && validWorkTypes.includes(body.work_type))
    updates.work_type = body.work_type;
  if (
    typeof body.employment_type === "string" &&
    validEmploymentTypes.includes(body.employment_type)
  )
    updates.employment_type = body.employment_type;
  if (typeof body.status === "string" && validStatuses.includes(body.status))
    updates.status = body.status;
  if (body.company_id !== undefined) updates.company_id = body.company_id || null;

  const supabase = await createClient();

  // Enforce active job limits when activating an existing job (best-effort; relies on DB values).
  if (updates.status === "active") {
    const { data: job } = await supabase
      .from("job_postings")
      .select("id,company_id,status")
      .eq("id", id)
      .maybeSingle();
    const companyId = (job as { company_id?: string | null } | null | undefined)?.company_id ?? null;
    if (companyId) {
      const [{ data: company }, { count: activeCount }] = await Promise.all([
        supabase.from("companies").select("id,max_active_jobs").eq("id", companyId).maybeSingle(),
        supabase
          .from("job_postings")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", "active"),
      ]);
      const maxActiveJobs = (company as { max_active_jobs?: number } | null | undefined)?.max_active_jobs ?? 3;
      const alreadyActive = (job as { status?: string } | null | undefined)?.status === "active";
      if (!alreadyActive && maxActiveJobs !== -1 && (activeCount ?? 0) >= maxActiveJobs) {
        return NextResponse.json(
          { error: `Plan limit reached: max ${maxActiveJobs} active job postings.` },
          { status: 402 }
        );
      }
    }
  }

  const { data, error } = await supabase
    .from("job_postings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_postings")
    .delete()
    .eq("id", id)
    ;

  if (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
