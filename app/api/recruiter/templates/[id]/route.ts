import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/validation";

const VALID_TEMPLATE_TYPES = [
  "general",
  "interview_invite",
  "rejection",
  "offer",
  "follow_up",
] as const;

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
    .from("message_templates")
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    updates.name = trimmed.slice(0, 200);
  }

  if (typeof body.content === "string") {
    const trimmed = body.content.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "content cannot be empty" }, { status: 400 });
    }
    updates.content = trimmed.slice(0, 5000);
  }

  if (typeof body.subject === "string") {
    updates.subject = body.subject.trim().slice(0, 500) || null;
  }

  if (typeof body.template_type === "string") {
    if (
      VALID_TEMPLATE_TYPES.includes(body.template_type as (typeof VALID_TEMPLATE_TYPES)[number])
    ) {
      updates.template_type = body.template_type;
    } else {
      return NextResponse.json({ error: "Invalid template_type" }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("message_templates")
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
    .from("message_templates")
    .delete()
    .eq("id", id)
    .eq("recruiter_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
