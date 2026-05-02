import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getUserStreak, recordDailyActivity } from "@/lib/streakSystem";
import { isValidActionType } from "@/lib/validation";

/**
 * GET /api/streak — Get current user's streak data
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const streak = await getUserStreak(user.id);
  return NextResponse.json(streak);
}

/**
 * POST /api/streak — Record daily activity (called on meaningful actions)
 * Body: { action_type?: string }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let actionType = "daily_login";
  try {
    const body = await request.json();
    if (body.action_type && typeof body.action_type === "string") {
      // Validate action_type against known allowlist to prevent arbitrary DB entries
      if (isValidActionType(body.action_type)) {
        actionType = body.action_type;
      }
      // Invalid action types silently fall back to "daily_login"
    }
  } catch {
    // Use default
  }

  const result = await recordDailyActivity(user.id, actionType);
  return NextResponse.json(result);
}
