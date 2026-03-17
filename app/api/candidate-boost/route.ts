import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { activateBoost, checkBoostStatus } from "@/lib/candidateBoost";

/** GET /api/candidate-boost — Check boost status */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await checkBoostStatus(user.id);
    return NextResponse.json(status);
  } catch (err) {
    console.error("Boost status error:", err);
    return NextResponse.json({ error: "Failed to check boost" }, { status: 500 });
  }
}

/** POST /api/candidate-boost — Activate boost (premium feature) */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is on premium plan
  const planType = user.profile?.plan_type || "free";
  if (planType === "free") {
    return NextResponse.json(
      { error: "Profile boost requires Pro or Premium plan" },
      { status: 403 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // Default values used
  }

  const duration = typeof body.duration_days === "number" ? body.duration_days : 7;
  const multiplier = planType === "premium" ? 2.5 : 2.0;

  try {
    const result = await activateBoost(user.id, duration, multiplier);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Boost activation error:", err);
    return NextResponse.json({ error: "Failed to activate boost" }, { status: 500 });
  }
}
