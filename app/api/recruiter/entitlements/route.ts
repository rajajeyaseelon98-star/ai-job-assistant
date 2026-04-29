import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type PlanTier = "starter" | "pro" | "enterprise";

function limitsForTier(tier: PlanTier) {
  if (tier === "enterprise") return { max_active_jobs: -1, max_team_members: -1 };
  if (tier === "pro") return { max_active_jobs: 25, max_team_members: 10 };
  return { max_active_jobs: 3, max_team_members: 3 };
}

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const requestedCompanyId = url.searchParams.get("company_id");

  const supabase = await createClient();
  const { data: memberships, error: mErr } = await supabase
    .from("company_memberships")
    .select("company_id,role,status")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (mErr) return NextResponse.json({ error: "Failed to load memberships" }, { status: 500 });

  const companyIds = (memberships || [])
    .map((m) => (m as { company_id: string }).company_id)
    .filter(Boolean);
  const companyId = requestedCompanyId && companyIds.includes(requestedCompanyId)
    ? requestedCompanyId
    : companyIds[0];
  if (!companyId) return NextResponse.json({ error: "No company membership" }, { status: 404 });

  const membership = (memberships || []).find(
    (m) => (m as { company_id: string }).company_id === companyId
  ) as { role?: string } | undefined;

  const { data: company, error } = await supabase
    .from("companies")
    .select("id,name,plan_tier,max_active_jobs,max_team_members,updated_at")
    .eq("id", companyId)
    .maybeSingle();
  if (error || !company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

  return NextResponse.json({
    company,
    membership_role: membership?.role ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Recruiter access required" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const company_id = typeof body.company_id === "string" ? body.company_id : null;
  const plan_tier = typeof body.plan_tier === "string" ? (body.plan_tier as PlanTier) : null;
  if (!company_id) return NextResponse.json({ error: "company_id is required" }, { status: 400 });
  if (plan_tier !== "starter" && plan_tier !== "pro" && plan_tier !== "enterprise") {
    return NextResponse.json({ error: "plan_tier must be starter, pro, or enterprise" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: membership, error: mErr } = await supabase
    .from("company_memberships")
    .select("role,status")
    .eq("company_id", company_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (mErr) return NextResponse.json({ error: "Failed to load membership" }, { status: 500 });
  const role = (membership as { role?: string } | null | undefined)?.role ?? null;
  if (role !== "owner" && role !== "admin") {
    return NextResponse.json({ error: "Only owner/admin can change plan" }, { status: 403 });
  }

  const limits = limitsForTier(plan_tier);
  const updates = { plan_tier, ...limits };

  // Prefer service role (RLS-safe) but keep an auth fallback.
  const admin = createServiceRoleClient();
  if (admin) {
    const { data, error } = await admin
      .from("companies")
      .update(updates)
      .eq("id", company_id)
      .select("id,name,plan_tier,max_active_jobs,max_team_members,updated_at")
      .single();
    if (error) return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
    return NextResponse.json({ company: data });
  }

  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", company_id)
    .select("id,name,plan_tier,max_active_jobs,max_team_members,updated_at")
    .single();
  if (error) return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  return NextResponse.json({ company: data });
}

