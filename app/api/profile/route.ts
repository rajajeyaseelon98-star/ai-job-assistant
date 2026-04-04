import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ensurePublicSlug } from "@/lib/publicProfile";
import { recalculateProfileStrengthForUser } from "@/lib/recalculate-profile-strength";

/** GET: Get own public profile settings */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, name, email, headline, bio, avatar_url, public_slug, profile_visible, profile_strength")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const [{ data: badges }, { count: resumeCount }, { data: bestAnalysis }] = await Promise.all([
    supabase
      .from("skill_badges")
      .select("skill_name, level, years_experience, verified")
      .eq("user_id", user.id)
      .order("years_experience", { ascending: false })
      .limit(20),
    supabase
      .from("resumes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("resume_analysis")
      .select("score, resumes!inner(user_id)")
      .eq("resumes.user_id", user.id)
      .order("score", { ascending: false })
      .limit(1)
      .single(),
  ]);

  return NextResponse.json({
    ...profile,
    badges: badges || [],
    resume_count: resumeCount || 0,
    best_ats_score: bestAnalysis?.score || null,
  });
}

/** PATCH: Update public profile */
export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createClient();

  const updates: Record<string, unknown> = {};

  if (typeof body.headline === "string") updates.headline = body.headline.slice(0, 150);
  if (typeof body.bio === "string") updates.bio = body.bio.slice(0, 500);
  if (typeof body.profile_visible === "boolean") updates.profile_visible = body.profile_visible;

  // Auto-generate slug if enabling profile
  if (body.profile_visible === true) {
    const name = user.profile?.name || user.email.split("@")[0];
    await ensurePublicSlug(user.id, name);
  }

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  const profile_strength = await recalculateProfileStrengthForUser(supabase, user.id);

  return NextResponse.json({ success: true, profile_strength, ...updates });
}
