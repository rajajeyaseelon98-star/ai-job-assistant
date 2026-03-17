import { createClient } from "@/lib/supabase/server";

/**
 * Generate a URL-friendly slug from user name.
 * Handles duplicates by appending random suffix.
 */
export function generateSlug(name: string): string {
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);

  // Add random suffix to avoid collisions
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug}-${suffix}`;
}

/**
 * Calculate profile strength (0-100) based on completeness.
 */
export function calculateProfileStrength(profile: {
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  skillCount: number;
  resumeCount: number;
  atsScore?: number | null;
}): number {
  let strength = 0;

  if (profile.name && profile.name.length > 2) strength += 15;
  if (profile.headline && profile.headline.length > 10) strength += 15;
  if (profile.bio && profile.bio.length > 30) strength += 15;
  if (profile.avatar_url) strength += 10;
  if (profile.skillCount >= 3) strength += 15;
  else if (profile.skillCount >= 1) strength += 8;
  if (profile.resumeCount >= 1) strength += 15;
  if (profile.atsScore && profile.atsScore >= 60) strength += 15;
  else if (profile.atsScore && profile.atsScore >= 40) strength += 8;

  return Math.min(100, strength);
}

/**
 * Create or get public profile slug for a user.
 */
export async function ensurePublicSlug(userId: string, name: string): Promise<string> {
  const supabase = await createClient();

  // Check if slug already exists
  const { data: user } = await supabase
    .from("users")
    .select("public_slug")
    .eq("id", userId)
    .single();

  if (user?.public_slug) return user.public_slug;

  // Generate unique slug
  let slug = generateSlug(name || "user");
  let attempts = 0;

  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("public_slug", slug)
      .single();

    if (!existing) break;
    slug = generateSlug(name || "user");
    attempts++;
  }

  await supabase
    .from("users")
    .update({ public_slug: slug })
    .eq("id", userId);

  return slug;
}
