import { createClient } from "./supabase/server";

export type PlanType = "free" | "pro";

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  plan_type: PlanType;
}

/** Get current user from Supabase Auth and their profile from public.users */
export async function getUser(): Promise<{
  id: string;
  email: string;
  profile: UserProfile | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, created_at, plan_type")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email,
    profile: profile as UserProfile | null,
  };
}

/** Ensure user exists in public.users (e.g. after signup). */
export async function ensureUserRow(userId: string, email: string) {
  const supabase = await createClient();
  await supabase.from("users").upsert(
    { id: userId, email, plan_type: "free" },
    { onConflict: "id" }
  );
}
