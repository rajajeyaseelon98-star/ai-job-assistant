import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("auto_apply_runs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { selected_job_ids } = body as { selected_job_ids?: string[] };
  if (!Array.isArray(selected_job_ids)) {
    return NextResponse.json({ error: "selected_job_ids array required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: run } = await supabase
    .from("auto_apply_runs")
    .select("results, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!run || run.status !== "ready_for_review") {
    return NextResponse.json({ error: "Run not found or not ready for review" }, { status: 400 });
  }

  const results = (run.results as Record<string, unknown>[]) || [];
  const selectedSet = new Set(selected_job_ids);
  const updated = results.map((r) => ({
    ...r,
    selected: selectedSet.has(String(r.job_id)),
  }));

  await supabase
    .from("auto_apply_runs")
    .update({ results: updated, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
