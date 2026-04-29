import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateProfileStrength } from "@/lib/publicProfile";

/** Recompute users.profile_strength from current DB state (avatar, headline, skills, resumes, ATS). */
export async function recalculateProfileStrengthForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: u, error: uErr } = await supabase
    .from("users")
    .select("name, headline, bio, avatar_url")
    .eq("id", userId)
    .single();

  if (uErr || !u) return 0;

  const [{ count: skillCount }, { count: resumeCount }, { data: bestScore }] = await Promise.all([
    supabase.from("skill_badges").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("resume_analysis")
      .select("score, resumes!inner(user_id)")
      .eq("resumes.user_id", userId)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const strength = calculateProfileStrength({
    name: u.name,
    headline: u.headline,
    bio: u.bio,
    avatar_url: u.avatar_url,
    skillCount: skillCount ?? 0,
    resumeCount: resumeCount ?? 0,
    atsScore: bestScore?.score ?? null,
  });

  await supabase.from("users").update({ profile_strength: strength }).eq("id", userId);

  return strength;
}
