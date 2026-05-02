import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getUserStreak } from "@/lib/streakSystem";
import { getStreakRewards, claimStreakReward } from "@/lib/streakRewards";

/**
 * GET /api/streak-rewards — Get available and claimed rewards
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const streak = await getUserStreak(user.id);
  const rewards = await getStreakRewards(user.id, streak.current_streak);

  return NextResponse.json({ streak, rewards });
}

/**
 * POST /api/streak-rewards — Manually claim a reward
 * Body: { streak_days: number }
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { streak_days } = await request.json();
  if (typeof streak_days !== "number") {
    return NextResponse.json({ error: "streak_days required" }, { status: 400 });
  }

  const streak = await getUserStreak(user.id);
  if (streak.current_streak < streak_days) {
    return NextResponse.json({ error: "Streak not yet reached" }, { status: 400 });
  }

  const result = await claimStreakReward(user.id, streak_days);
  return NextResponse.json(result);
}
