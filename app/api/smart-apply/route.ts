import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import type { SmartApplyRules } from "@/types/autoApply";

const DEFAULT_RULES: SmartApplyRules = {
  min_match_score: 75,
  preferred_roles: [],
  preferred_locations: [],
  include_remote: true,
  max_applications_per_day: 5,
  max_applications_per_week: 20,
};

/** GET: List user's smart apply rules */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("smart_apply_rules")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load rules" }, { status: 500 });
  }

  const enriched = (data || []).map((rule) => {
    const reasonCode =
      rule.enabled === false
        ? "RULE_DISABLED"
        : !rule.last_run_at
          ? "NOT_RUN_YET"
          : Number(rule.total_applied || 0) === 0
            ? "NO_MATCHING_JOBS"
            : "APPLIED_SUCCESS";
    return {
      ...rule,
      last_outcome_reason: reasonCode,
      last_execution_meta: {
        lastRunAt: rule.last_run_at,
        nextRunAt: rule.next_run_at,
        reasonCode,
      },
    };
  });

  return NextResponse.json(enriched);
}

/** POST: Create or update smart apply rule */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Pro/Premium only
  const planType = user.profile?.plan_type ?? "free";
  if (planType === "free") {
    return NextResponse.json(
      { error: "Smart Auto-Apply is a Pro feature. Upgrade to enable." },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const resumeId = String(body.resume_id || "");
  if (!resumeId) {
    return NextResponse.json({ error: "resume_id is required" }, { status: 400 });
  }

  // Verify resume ownership
  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id")
    .eq("id", resumeId)
    .eq("user_id", user.id)
    .single();

  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  // Build rules from input
  const rules: SmartApplyRules = {
    min_match_score: Math.min(100, Math.max(50, Number(body.min_match_score) || DEFAULT_RULES.min_match_score)),
    min_salary: typeof body.min_salary === "number" ? body.min_salary : undefined,
    max_salary: typeof body.max_salary === "number" ? body.max_salary : undefined,
    preferred_roles: Array.isArray(body.preferred_roles)
      ? body.preferred_roles.map(String).filter(Boolean).slice(0, 10)
      : DEFAULT_RULES.preferred_roles,
    preferred_locations: Array.isArray(body.preferred_locations)
      ? body.preferred_locations.map(String).filter(Boolean).slice(0, 5)
      : DEFAULT_RULES.preferred_locations,
    include_remote: body.include_remote !== false,
    max_applications_per_day: Math.min(20, Math.max(1, Number(body.max_applications_per_day) || DEFAULT_RULES.max_applications_per_day)),
    max_applications_per_week: Math.min(100, Math.max(1, Number(body.max_applications_per_week) || DEFAULT_RULES.max_applications_per_week)),
  };

  const enabled = body.enabled !== false;

  // Upsert (one rule per resume)
  const { data: rule, error } = await supabase
    .from("smart_apply_rules")
    .upsert(
      {
        user_id: user.id,
        resume_id: resumeId,
        enabled,
        rules,
        next_run_at: enabled ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,resume_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to save rule" }, { status: 500 });
  }

  return NextResponse.json(rule);
}

/** PATCH: Toggle enable/disable */
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

  const ruleId = String(body.id || "");
  const enabled = Boolean(body.enabled);

  if (!ruleId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("smart_apply_rules")
    .update({
      enabled,
      next_run_at: enabled ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ruleId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
  }

  return NextResponse.json({ success: true, enabled });
}
