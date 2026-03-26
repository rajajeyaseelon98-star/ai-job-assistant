import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getE2eMockUserApiResponse, isE2eMockUserId } from "@/lib/e2e-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isE2eMockUserId(user.id) && user.profile?.role) {
    return NextResponse.json(getE2eMockUserApiResponse(user.profile.role));
  }
  const supabase = await createClient();
  const [{ data: profile }, { data: prefs }] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, name, plan_type, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_preferences")
      .select("experience_level, preferred_role, preferred_location, salary_expectation")
      .eq("user_id", user.id)
      .single(),
  ]);
  return NextResponse.json({
    ...profile,
    preferences: prefs ?? {
      experience_level: null,
      preferred_role: null,
      preferred_location: null,
      salary_expectation: null,
    },
  });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (isE2eMockUserId(user.id)) {
    return NextResponse.json({ ok: true });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createClient();

  if (body.name !== undefined) {
    if (typeof body.name !== "string" && body.name !== null) {
      return NextResponse.json({ error: "name must be a string" }, { status: 400 });
    }
  }
  const name = body.name !== undefined
    ? (typeof body.name === "string" ? body.name.trim().slice(0, 100) : null)
    : undefined;

  const rawExpLevel = body.experience_level ?? body.experienceLevel;
  const rawRole = body.preferred_role ?? body.preferredRole;
  const rawLocation = body.preferred_location ?? body.preferredLocation;
  const rawSalary = body.salary_expectation ?? body.salaryExpectation;

  const prefs = {
    experience_level: typeof rawExpLevel === "string" ? rawExpLevel.slice(0, 50) : null,
    preferred_role: typeof rawRole === "string" ? rawRole.trim().slice(0, 200) : null,
    preferred_location: typeof rawLocation === "string" ? rawLocation.trim().slice(0, 200) : null,
    salary_expectation: typeof rawSalary === "string" ? rawSalary.trim().slice(0, 100) : null,
  };
  const hasPrefs = Object.values(prefs).some((v) => v != null && v !== "");

  if (name !== undefined && hasPrefs) {
    await Promise.all([
      supabase.from("users").update({ name }).eq("id", user.id),
      supabase.from("user_preferences").upsert(
        { user_id: user.id, ...prefs, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      ),
    ]);
  } else if (name !== undefined) {
    await supabase.from("users").update({ name }).eq("id", user.id);
  } else if (hasPrefs) {
    await supabase.from("user_preferences").upsert(
      { user_id: user.id, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }

  return NextResponse.json({ ok: true });
}
