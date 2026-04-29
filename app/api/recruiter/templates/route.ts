import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateTextLength } from "@/lib/validation";

const VALID_TEMPLATE_TYPES = [
  "general",
  "interview_invite",
  "rejection",
  "offer",
  "follow_up",
] as const;

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
  if (mErr) return NextResponse.json({ error: "Failed to load memberships" }, { status: 500 });
  const companyIds = (memberships || []).map((m) => (m as { company_id: string }).company_id).filter(Boolean);
  if (!companyIds.length) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .in("company_id", companyIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 });
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

  const { name, subject, content, template_type } = body as {
    name?: string;
    subject?: string;
    content?: string;
    template_type?: string;
  };

  // Validate text input sizes
  const nameVal = validateTextLength(name, 200, "name");
  if (!nameVal.valid) return NextResponse.json({ error: nameVal.error }, { status: 400 });
  const contentVal = validateTextLength(content, 5000, "content");
  if (!contentVal.valid) return NextResponse.json({ error: contentVal.error }, { status: 400 });

  const typeVal =
    template_type && VALID_TEMPLATE_TYPES.includes(template_type as (typeof VALID_TEMPLATE_TYPES)[number])
      ? template_type
      : "general";

  const supabase = await createClient();
  const { data: memberships, error: mErr } = await supabase
    .from("company_memberships")
    .select("company_id,status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);
  if (mErr) return NextResponse.json({ error: "Failed to resolve company" }, { status: 500 });
  const companyId = (memberships?.[0] as { company_id: string } | undefined)?.company_id || null;
  if (!companyId) return NextResponse.json({ error: "No active company membership" }, { status: 403 });

  const { data, error } = await supabase
    .from("message_templates")
    .insert({
      recruiter_id: user.id,
      company_id: companyId,
      name: nameVal.text.slice(0, 200),
      subject: subject?.trim().slice(0, 500) || null,
      content: contentVal.text.slice(0, 5000),
      template_type: typeVal,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert template error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
