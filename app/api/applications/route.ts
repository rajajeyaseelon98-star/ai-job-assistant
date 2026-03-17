import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { logActivity, checkAndLogMilestones } from "@/lib/activityFeed";
import { recordDailyActivity } from "@/lib/streakSystem";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load applications" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { company, role, status, applied_date, url, salary, location, notes } = body as {
    company?: string;
    role?: string;
    status?: string;
    applied_date?: string;
    url?: string;
    salary?: string;
    location?: string;
    notes?: string;
  };

  if (!company?.trim() || !role?.trim()) {
    return NextResponse.json({ error: "company and role are required" }, { status: 400 });
  }

  const validStatuses = ["saved", "applied", "interviewing", "offer", "rejected", "withdrawn"];
  const statusVal = validStatuses.includes(status || "") ? status : "saved";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: user.id,
      company: company.trim().slice(0, 200),
      role: role.trim().slice(0, 200),
      status: statusVal,
      applied_date: applied_date || null,
      url: url?.trim().slice(0, 500) || null,
      salary: salary?.trim().slice(0, 100) || null,
      location: location?.trim().slice(0, 200) || null,
      notes: notes?.trim().slice(0, 2000) || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Insert application error:", error);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }

  // Log activity + streak (non-blocking)
  logActivity(
    user.id,
    "application_submitted",
    `Applied to ${role} at ${company}`,
    undefined,
    { company, role, application_id: data.id },
    true
  ).catch(() => {});
  checkAndLogMilestones(user.id).catch(() => {});
  recordDailyActivity(user.id, "apply").catch(() => {});

  return NextResponse.json(data, { status: 201 });
}
