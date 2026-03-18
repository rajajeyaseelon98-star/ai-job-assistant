import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateTextLength } from "@/lib/validation";

// Smart Job Alerts: Saved searches that can be used for notifications
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("recruiter_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load alerts" }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "recruiter") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, filters } = body as { name?: string; filters?: Record<string, unknown> };
  const nameVal = validateTextLength(name, 200, "name");
  if (!nameVal.valid) return NextResponse.json({ error: nameVal.error }, { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      recruiter_id: user.id,
      name: nameVal.text.slice(0, 200),
      filters: filters || {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
