import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkAndLogUsage } from "@/lib/usage";
import { checkRateLimit } from "@/lib/rateLimit";
import { runAutoApply } from "@/lib/autoApplyEngine";
import { recordDailyActivity } from "@/lib/streakSystem";
import { isValidUUID } from "@/lib/validation";
import type { AutoApplyConfig } from "@/types/autoApply";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const config: AutoApplyConfig = {
    resume_id: String(body.resume_id || ""),
    location: typeof body.location === "string" ? body.location.trim() : undefined,
    preferred_roles: Array.isArray(body.preferred_roles) ? body.preferred_roles.slice(0, 10) : undefined,
    min_salary: typeof body.min_salary === "number" ? body.min_salary : undefined,
    max_results: typeof body.max_results === "number" ? Math.min(Math.max(body.max_results, 1), 15) : 10,
  };

  if (!config.resume_id || !isValidUUID(config.resume_id)) {
    return NextResponse.json({ error: "Valid resume_id is required" }, { status: 400 });
  }

  // Atomic usage check + log (BUG-002 fix)
  const planType = user.profile?.plan_type ?? "free";
  const { allowed } = await checkAndLogUsage(user.id, "auto_apply", planType);
  if (!allowed) {
    return NextResponse.json(
      { error: "Free limit reached for Auto Apply. Upgrade to Pro for unlimited." },
      { status: 403 }
    );
  }

  // Verify resume belongs to user
  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id")
    .eq("id", config.resume_id)
    .eq("user_id", user.id)
    .single();

  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  // Create run record
  const { data: run, error } = await supabase
    .from("auto_apply_runs")
    .insert({
      user_id: user.id,
      resume_id: config.resume_id,
      status: "pending",
      config,
    })
    .select("id")
    .single();

  if (error || !run) {
    return NextResponse.json({ error: "Failed to create auto-apply run" }, { status: 500 });
  }

  // Usage already logged by checkAndLogUsage above
  recordDailyActivity(user.id, "apply").catch(() => {});

  // Fire and forget with 2-minute timeout safety net
  const AUTO_APPLY_TIMEOUT = 120_000;
  Promise.race([
    runAutoApply(run.id, user.id, config),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Auto-apply timed out after 2 minutes")), AUTO_APPLY_TIMEOUT)
    ),
  ]).catch(async (err) => {
    console.error("Auto-apply engine error:", err);
    const sb = await createClient();
    await sb
      .from("auto_apply_runs")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .eq("user_id", user.id);
  });

  return NextResponse.json({ id: run.id, status: "pending" });
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("auto_apply_runs")
    .select("id, status, jobs_found, jobs_matched, jobs_applied, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: "Failed to load runs" }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
