import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Deletes current user's data and signs out. Full auth user deletion requires Supabase service role. */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createClient();
  await supabase.from("users").delete().eq("id", user.id);
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
