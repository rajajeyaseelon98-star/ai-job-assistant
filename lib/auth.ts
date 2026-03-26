import { buildGetUserResultFromE2eRole, readE2eMockRoleFromCookies } from "./e2e-auth";
import { createClient } from "./supabase/server";
import { cookies } from "next/headers";

export type PlanType = "free" | "pro" | "premium";
export type UserRole = "job_seeker" | "recruiter";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  plan_type: PlanType;
  role: UserRole;
}

/** Get current user from Supabase Auth and their profile from public.users */
export async function getUser(): Promise<{
  id: string;
  email: string;
  profile: UserProfile | null;
} | null> {
  const cookieStore = await cookies();
  const e2eRole = readE2eMockRoleFromCookies(cookieStore);
  if (e2eRole) {
    const u = buildGetUserResultFromE2eRole(e2eRole);
    return { ...u, profile: u.profile as UserProfile };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  let { data: profile } = await supabase
    .from("users")
    .select("id, email, name, created_at, plan_type, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await ensureUserRow(user.id, user.email);
    const res = await supabase
      .from("users")
      .select("id, email, name, created_at, plan_type, role")
      .eq("id", user.id)
      .single();
    profile = res.data;
  }

  return {
    id: user.id,
    email: user.email,
    profile: profile as UserProfile | null,
  };
}

/** Ensure user exists in public.users (e.g. after signup). Only inserts when missing; never overwrites existing rows (e.g. plan_type). */
export async function ensureUserRow(userId: string, email: string) {
  const supabase = await createClient();
  await supabase.from("users").upsert(
    { id: userId, email, plan_type: "free", role: "job_seeker" },
    { onConflict: "id", ignoreDuplicates: true }
  );
}
