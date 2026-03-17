import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserStreak, recordDailyActivity } from "@/lib/streakSystem";

/**
 * GET /api/streak — Get current user's streak data
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const streak = await getUserStreak(user.id);
  return NextResponse.json(streak);
}

/**
 * POST /api/streak — Record daily activity (called on meaningful actions)
 * Body: { action_type?: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let actionType = "daily_login";
  try {
    const body = await request.json();
    if (body.action_type) actionType = body.action_type;
  } catch {
    // Use default
  }

  const result = await recordDailyActivity(user.id, actionType);
  return NextResponse.json(result);
}
