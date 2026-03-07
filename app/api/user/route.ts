import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, plan_type")
    .eq("id", user.id)
    .single();
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("experience_level, preferred_role, preferred_location, salary_expectation")
    .eq("user_id", user.id)
    .single();
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
  const body = await request.json();
  const supabase = await createClient();

  if (body.name !== undefined) {
    await supabase.from("users").update({ name: body.name }).eq("id", user.id);
  }
  const prefs = {
    experience_level: body.experience_level ?? body.experienceLevel,
    preferred_role: body.preferred_role ?? body.preferredRole,
    preferred_location: body.preferred_location ?? body.preferredLocation,
    salary_expectation: body.salary_expectation ?? body.salaryExpectation,
  };
  const hasPrefs = Object.values(prefs).some((v) => v != null && v !== "");
  if (hasPrefs) {
    await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        ...prefs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }
  return NextResponse.json({ ok: true });
}
