import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { scanOpportunities } from "@/lib/opportunityAlerts";

/**
 * POST /api/opportunity-alerts/scan
 * Fire-and-forget scan decoupled from the main alerts GET.
 * The client calls this in the background; the UI loads cached alerts instantly.
 */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await scanOpportunities(user.id).catch(() => 0);
  return NextResponse.json({ scanned: true, alertsCreated: count });
}
