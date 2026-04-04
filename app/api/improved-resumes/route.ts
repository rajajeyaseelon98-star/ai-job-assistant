import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** GET /api/improved-resumes — list current user's AI improved resumes (for Job Board apply picker, etc.). */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("improved_resumes")
    .select("id, job_title, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to load improved resumes" }, { status: 500 });
  }

  const improvedResumes = (data ?? []).map((r) => ({
    id: r.id,
    label: r.job_title?.trim() || "Improved resume",
    created_at: r.created_at,
  }));

  return NextResponse.json({ improvedResumes });
}
