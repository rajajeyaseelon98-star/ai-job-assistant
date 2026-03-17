import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDailyActions, completeDailyAction, getDailyProgress } from "@/lib/dailyActions";

/**
 * GET /api/daily-actions — Get today's personalized action items
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [actions, progress] = await Promise.all([
    generateDailyActions(user.id),
    getDailyProgress(user.id),
  ]);

  return NextResponse.json({ actions, progress });
}

/**
 * PATCH /api/daily-actions — Mark an action as completed
 * Body: { action_id: string }
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action_id } = await request.json();
  if (!action_id) return NextResponse.json({ error: "action_id required" }, { status: 400 });

  const result = await completeDailyAction(user.id, action_id);
  const progress = await getDailyProgress(user.id);

  return NextResponse.json({ ...result, progress });
}
