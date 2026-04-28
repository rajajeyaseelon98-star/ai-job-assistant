import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile?.role !== "job_seeker") {
    return NextResponse.json({ error: "Only job seekers can view this" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitRaw || "50") || 50, 1), 200);

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("job_applications")
    .select(
      `
      id, job_id, candidate_id, resume_id, stage, match_score, recruiter_notes, created_at, updated_at,
      job:job_postings!job_applications_job_id_fkey(id, title, company_id),
      company:companies!job_postings_company_id_fkey(id, name, website, industry, location, logo_url)
    `
    )
    .eq("candidate_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: "Failed to load job applications" }, { status: 500 });

  const appIds = (rows || []).map((r) => (r as { id: string }).id).filter(Boolean);
  let eventsByApp: Record<string, unknown[]> = {};
  if (appIds.length) {
    const { data: events } = await supabase
      .from("application_events")
      .select("application_id, event_type, from_stage, to_stage, meta, created_at, actor_user_id")
      .in("application_id", appIds)
      .order("created_at", { ascending: false })
      .limit(500);
    for (const e of events || []) {
      const id = String((e as { application_id: string }).application_id);
      (eventsByApp[id] ||= []).push(e as unknown as Record<string, unknown>);
    }
  }

  const enriched = (rows || []).map((r) => ({
    ...r,
    events: eventsByApp[String((r as { id: string }).id)] || [],
  }));

  return NextResponse.json({ rows: enriched });
}

