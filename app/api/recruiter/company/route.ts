import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateTextLength } from "@/lib/validation";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const [{ data: ownedCompanies, error: ownedError }, { data: memberships, error: memberError }] =
    await Promise.all([
      supabase
        .from("companies")
        .select("*")
        .eq("recruiter_id", user.id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("company_memberships")
        .select("role,status,company:companies(*)")
        .eq("user_id", user.id),
    ]);

  if (ownedError || memberError) {
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 });
  }

  const membershipCompanies = (memberships || [])
    .map((m) => {
      const row = m as Record<string, unknown>;
      const company = row.company as Record<string, unknown> | null | undefined;
      if (!company) return null;
      return {
        ...company,
        membership_role: row.role,
        membership_status: row.status,
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  const owned = (ownedCompanies || []) as Record<string, unknown>[];
  const seen = new Set<string>();
  const merged = [...membershipCompanies, ...owned].filter((c) => {
    const id = String((c as Record<string, unknown>).id || "");
    if (!id) return false;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return NextResponse.json(merged);
}

const VALID_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

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

  const { name, description, website, logo_url, industry, size, location, culture, benefits } =
    body as {
      name?: string;
      description?: string;
      website?: string;
      logo_url?: string;
      industry?: string;
      size?: string;
      location?: string;
      culture?: string;
      benefits?: string;
    };

  // Validate required + large text fields
  const nameVal = validateTextLength(name, 200, "name");
  if (!nameVal.valid) return NextResponse.json({ error: nameVal.error }, { status: 400 });
  if (description && description.length > 5000) {
    return NextResponse.json({ error: "description exceeds maximum length of 5000 characters" }, { status: 400 });
  }
  if (culture && culture.length > 5000) {
    return NextResponse.json({ error: "culture exceeds maximum length of 5000 characters" }, { status: 400 });
  }
  if (benefits && benefits.length > 5000) {
    return NextResponse.json({ error: "benefits exceeds maximum length of 5000 characters" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({
      recruiter_id: user.id,
      name: nameVal.text.slice(0, 200),
      description: description?.trim().slice(0, 5000) || null,
      website: website?.trim().slice(0, 500) || null,
      logo_url: logo_url?.trim().slice(0, 500) || null,
      industry: industry?.trim().slice(0, 200) || null,
      size: typeof size === "string" && VALID_SIZES.includes(size) ? size : null,
      location: location?.trim().slice(0, 200) || null,
      culture: culture?.trim().slice(0, 5000) || null,
      benefits: benefits?.trim().slice(0, 5000) || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert company error:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }

  // Create an owner membership row (enables multi-user recruiter teams)
  const { error: membershipError } = await supabase.from("company_memberships").insert({
    company_id: data.id,
    user_id: user.id,
    role: "owner",
    status: "active",
    invited_by: null,
  });
  if (membershipError) {
    console.warn("[company] failed to create owner membership (non-fatal)", {
      companyId: data.id,
      error: membershipError.message,
    });
  }

  return NextResponse.json({ ...data, membership_role: "owner", membership_status: "active" }, { status: 201 });
}
