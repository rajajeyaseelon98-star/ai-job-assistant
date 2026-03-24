import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveAlerts, dismissAlert, markAlertSeen } from "@/lib/opportunityAlerts";

/**
 * GET /api/opportunity-alerts — Get active alerts for user (fast read only).
 * Scanning is decoupled to POST /api/opportunity-alerts/scan.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alerts = await getActiveAlerts(user.id);
  return NextResponse.json(alerts);
}

/**
 * PATCH /api/opportunity-alerts — Dismiss or mark seen
 * Body: { alert_id: string, action: "dismiss" | "seen" }
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { alert_id, action } = await request.json();
  if (!alert_id) return NextResponse.json({ error: "alert_id required" }, { status: 400 });

  if (action === "dismiss") {
    await dismissAlert(user.id, alert_id);
  } else {
    await markAlertSeen(user.id, alert_id);
  }

  return NextResponse.json({ success: true });
}
