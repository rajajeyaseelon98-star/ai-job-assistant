import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidUUID } from "@/lib/validation";

const VALID_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

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
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("recruiter_id", user.id)
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

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    updates.name = trimmed.slice(0, 200);
  }
  if (typeof body.description === "string")
    updates.description = body.description.trim().slice(0, 5000) || null;
  if (typeof body.website === "string")
    updates.website = body.website.trim().slice(0, 500) || null;
  if (typeof body.logo_url === "string")
    updates.logo_url = body.logo_url.trim().slice(0, 500) || null;
  if (typeof body.industry === "string")
    updates.industry = body.industry.trim().slice(0, 200) || null;
  if (typeof body.size === "string")
    updates.size = VALID_SIZES.includes(body.size) ? body.size : null;
  if (typeof body.location === "string")
    updates.location = body.location.trim().slice(0, 200) || null;
  if (typeof body.culture === "string")
    updates.culture = body.culture.trim().slice(0, 5000) || null;
  if (typeof body.benefits === "string")
    updates.benefits = body.benefits.trim().slice(0, 5000) || null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .update(updates)
    .eq("id", id)
    .eq("recruiter_id", user.id)
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
    .from("companies")
    .delete()
    .eq("id", id)
    .eq("recruiter_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
